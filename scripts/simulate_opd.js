import connectDB from "../utils/lib.js";
import { allocateToken } from "../Algorithm/TokenAllocator.js";

/* Simple simulation script for one OPD day with 3 doctors.
   Run: `node scripts/simulate_opd.js`
   (project has `type: "module"` in package.json so Node will treat .js as ESM)
*/

const now = new Date();
const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const hrs = (h) => new Date(day.getTime() + h * 3600 * 1000).toISOString();

const doctors = [
  { email: "dr.alice@example.com", name: "Dr Alice" },
  { email: "dr.bob@example.com", name: "Dr Bob" },
  { email: "dr.cathy@example.com", name: "Dr Cathy" },
];

const slots = [
  { start: hrs(9), end: hrs(10), capacity: 4 },
  { start: hrs(10), end: hrs(11), capacity: 4 },
  { start: hrs(11), end: hrs(12), capacity: 4 },
];

const run = async () => {
  const db = await connectDB();
  const Slots = db.collection("Slots");
  const Tokens = db.collection("Tokens");

  // ensure fresh collections for simulation
  await Slots.deleteMany({});
  await Tokens.deleteMany({});

  // create slots for each doctor
  for (const d of doctors) {
    for (const s of slots) {
      await Slots.insertOne({ doctorEmail: d.email, slotStart: s.start, slotEnd: s.end, capacity: s.capacity });
    }
  }

  // simulate mixed bookings
  const sources = ["online", "walkin", "paid", "followup"];

  // Book a few tokens for each doctor/slot
  for (const d of doctors) {
    for (const s of slots) {
      // random number of bookings
      const n = Math.floor(Math.random() * (s.capacity + 2));
      for (let i = 0; i < n; i++) {
        const source = sources[Math.floor(Math.random() * sources.length)];
        const res = await allocateToken({ doctorEmail: d.email, slotStart: s.start, slotEnd: s.end, source });
        console.log("Booked", d.email, s.start, source, res.allocated ? "allocated" : "waitlisted");
      }
    }
  }

  // emergency insert for doctor 1 in 9-10
  const emergency = await allocateToken({ doctorEmail: doctors[0].email, slotStart: slots[0].start, slotEnd: slots[0].end, source: "emergency" });
  console.log("Emergency insert result:", emergency);

  // print final status for first doctor slot
  const { remaining, active, waitlisted } = await (async () => {
    const Token = db.collection("Tokens");
    const active = await Token.find({ doctorEmail: doctors[0].email, slotStart: slots[0].start, slotEnd: slots[0].end, status: "active" }).toArray();
    const waitlisted = await Token.find({ doctorEmail: doctors[0].email, slotStart: slots[0].start, slotEnd: slots[0].end, status: "waitlisted" }).toArray();
    const slot = await Slots.findOne({ doctorEmail: doctors[0].email, slotStart: slots[0].start, slotEnd: slots[0].end });
    return { remaining: Math.max(0, slot.capacity - active.length), active, waitlisted };
  })();

  console.log("Final slot status for", doctors[0].email, slots[0].start);
  console.log("Remaining capacity:", remaining);
  console.log("Active tokens:", active.map(a => ({ tokenNumber: a.tokenNumber, source: a.source, status: a.status })));
  console.log("Waitlisted:", waitlisted.map(w => ({ source: w.source, priority: w.priority })));

  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
