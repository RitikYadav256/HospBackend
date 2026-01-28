import connectDB from "../utils/lib.js";

/*
Token allocation algorithm utilities.

Data model (collection `Tokens`):
{
  _id,
  doctorEmail: string,
  slotStart: ISODate (or string),
  slotEnd: ISODate (or string),
  tokenNumber: number,
  source: 'online'|'walkin'|'paid'|'followup'|'emergency',
  status: 'active'|'cancelled'|'completed'|'no-show'|'waitlisted'|'preempted',
  priority: number, // lower value = higher priority (1 is highest)
  createdAt: Date
}

Priority order (default):
 emergency:1, paid:2, followup:3, online:4, walkin:5

Behavior:
 - Enforce per-slot capacity (slotCapacity stored in `Slots` collection documents)
 - If slot has space: assign next tokenNumber
 - If slot full and incoming has higher priority than lowest active token: preempt lowest and either move them to next slot or mark waitlisted
 - On cancellation/no-show: promote highest-priority waitlisted into slot

This module exports functions used by controllers to allocate, cancel and reallocate tokens.
*/

const DEFAULT_PRIORITIES = {
  emergency: 1,
  paid: 2,
  followup: 3,
  online: 4,
  walkin: 5,
};

const getPriority = (source) => DEFAULT_PRIORITIES[source] ?? 99;

const allocateToken = async ({ doctorEmail, slotStart, slotEnd, source }) => {
  const db = await connectDB();
  const Tokens = db.collection("Tokens");
  const Slots = db.collection("Slots");

  // find slot definition for capacity
  const slot = await Slots.findOne({ doctorEmail, slotStart, slotEnd });
  const capacity = slot?.capacity ?? 6; // default capacity if not set

  // count active tokens in this slot
  const activeTokens = await Tokens.find({ doctorEmail, slotStart, slotEnd, status: "active" }).toArray();

  const incomingPriority = getPriority(source);

  if (activeTokens.length < capacity) {
    // assign next tokenNumber
    const maxToken = await Tokens.aggregate([
      { $match: { doctorEmail, slotStart, slotEnd } },
      { $group: { _id: null, max: { $max: "$tokenNumber" } } }
    ]).toArray();
    const nextToken = (maxToken[0]?.max || 0) + 1;
    const doc = {
      doctorEmail,
      slotStart,
      slotEnd,
      tokenNumber: nextToken,
      source,
      status: "active",
      priority: incomingPriority,
      createdAt: new Date(),
    };
    const r = await Tokens.insertOne(doc);
    return { allocated: true, token: { id: r.insertedId, ...doc } };
  }

  // slot is full. check lowest priority active token
  const lowest = activeTokens.reduce((acc, t) => (acc === null || t.priority > acc.priority ? t : acc), null);
  if (lowest && incomingPriority < lowest.priority) {
    // preempt lowest token
    await Tokens.updateOne({ _id: lowest._id }, { $set: { status: "preempted" } });

    // assign the incoming token the same tokenNumber (take its place)
    const doc = {
      doctorEmail,
      slotStart,
      slotEnd,
      tokenNumber: lowest.tokenNumber,
      source,
      status: "active",
      priority: incomingPriority,
      createdAt: new Date(),
    };
    const r = await Tokens.insertOne(doc);

    // try to move the preempted token to the next available slot for the same doctor
    const moved = await _moveToNextAvailableSlot(db, lowest);

    return { allocated: true, token: { id: r.insertedId, ...doc }, preempted: lowest, moved };
  }

  // otherwise, place them on waitlist
  const waitDoc = {
    doctorEmail,
    slotStart,
    slotEnd,
    tokenNumber: null,
    source,
    status: "waitlisted",
    priority: incomingPriority,
    createdAt: new Date(),
  };
  const r = await Tokens.insertOne(waitDoc);
  return { allocated: false, waitlisted: true, token: { id: r.insertedId, ...waitDoc } };
};

const _moveToNextAvailableSlot = async (db, token) => {
  const Tokens = db.collection("Tokens");
  const Slots = db.collection("Slots");

  // find future slots for same doctor ordered by start
  const futureSlots = await Slots.find({ doctorEmail: token.doctorEmail, slotStart: { $gt: token.slotStart } }).sort({ slotStart: 1 }).toArray();
  for (const s of futureSlots) {
    const count = await Tokens.countDocuments({ doctorEmail: token.doctorEmail, slotStart: s.slotStart, slotEnd: s.slotEnd, status: "active" });
    if (count < (s.capacity ?? 6)) {
      // assign new tokenNumber as next available
      const maxToken = await Tokens.aggregate([
        { $match: { doctorEmail: token.doctorEmail, slotStart: s.slotStart, slotEnd: s.slotEnd } },
        { $group: { _id: null, max: { $max: "$tokenNumber" } } }
      ]).toArray();
      const nextToken = (maxToken[0]?.max || 0) + 1;
      await Tokens.updateOne({ _id: token._id }, { $set: { slotStart: s.slotStart, slotEnd: s.slotEnd, tokenNumber: nextToken, status: "active" } });
      return { movedTo: { slotStart: s.slotStart, slotEnd: s.slotEnd, tokenNumber: nextToken } };
    }
  }
  // nowhere to move - mark waitlisted
  await Tokens.updateOne({ _id: token._id }, { $set: { status: "waitlisted" } });
  return { movedTo: null };
};

const cancelToken = async (tokenId) => {
  const db = await connectDB();
  const Tokens = db.collection("Tokens");
  const token = await Tokens.findOne({ _id: tokenId });
  if (!token) return { ok: false, message: "Token not found" };
  await Tokens.updateOne({ _id: tokenId }, { $set: { status: "cancelled" } });

  // promote a waitlisted token for same slot if any
  const promoted = await Tokens.findOneAndUpdate(
    { doctorEmail: token.doctorEmail, slotStart: token.slotStart, slotEnd: token.slotEnd, status: "waitlisted" },
    { $set: { status: "active", tokenNumber: token.tokenNumber } },
    { sort: { priority: 1, createdAt: 1 }, returnDocument: "after" }
  );

  return { ok: true, promoted: promoted.value };
};

const getSlotStatus = async ({ doctorEmail, slotStart, slotEnd }) => {
  const db = await connectDB();
  const Tokens = db.collection("Tokens");
  const Slots = db.collection("Slots");
  const slot = await Slots.findOne({ doctorEmail, slotStart, slotEnd });
  const capacity = slot?.capacity ?? 6;
  const active = await Tokens.find({ doctorEmail, slotStart, slotEnd, status: "active" }).sort({ tokenNumber: 1 }).toArray();
  const waitlisted = await Tokens.find({ doctorEmail, slotStart, slotEnd, status: "waitlisted" }).sort({ priority: 1, createdAt: 1 }).toArray();
  return { slot, capacity, active, waitlisted, remaining: Math.max(0, capacity - active.length) };
};

export { allocateToken, cancelToken, getSlotStatus };
