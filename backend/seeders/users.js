// Demo accounts. Portraits are downloaded at seed time and stored like real uploads.
const portrait = (gender, index) => `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;

module.exports = [
  { name: "Demo Attendee", email: "demo.user@eventflow.test", role: "user", portrait: portrait("men", 32) },
  { name: "Ayesha Khan", email: "ayesha@eventflow.test", role: "user", portrait: portrait("women", 44) },
  { name: "Bilal Ahmed", email: "bilal@eventflow.test", role: "user", portrait: portrait("men", 75) },
  { name: "Hamza Raza", email: "hamza@eventflow.test", role: "user", portrait: portrait("men", 11) },
  { name: "Sana Malik", email: "sana@eventflow.test", role: "user", portrait: portrait("women", 65) },
  { name: "Zara Iqbal", email: "zara@eventflow.test", role: "user", portrait: portrait("women", 21) },
  { name: "Usman Tariq", email: "usman@eventflow.test", role: "user", portrait: portrait("men", 52) },
  { name: "Mahnoor Sheikh", email: "mahnoor@eventflow.test", role: "user", portrait: portrait("women", 90) },
  { name: "Ali Hassan", email: "ali@eventflow.test", role: "user", portrait: portrait("men", 86) },
  { name: "Fatima Noor", email: "fatima@eventflow.test", role: "user", portrait: portrait("women", 12) },
  { name: "Maya Organizer", email: "organizer@eventflow.test", role: "organizer", portrait: portrait("women", 33) },
  { name: "EventFlow Admin", email: "admin@eventflow.test", role: "admin", portrait: portrait("men", 3) },
];
