const mongoose = require('mongoose');
const uri = "mongodb+srv://dbconexta:Clave2025profix@conecta.jmuojga.mongodb.net/profix?appName=Conecta";

const categorySchema = new mongoose.Schema({
  name: String,
  icon: String,
  isActive: Boolean
});
const Category = mongoose.model('Category', categorySchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isVerified: Boolean
});
const User = mongoose.model('User', userSchema);

async function run() {
  try {
    console.log("Connecting...");
    await mongoose.connect(uri);
    console.log("Connected.");

    const cats = await Category.find({});
    console.log("Categories:", cats.map(c => `${c.name} (Icon: ${c.icon}, Active: ${c.isActive})`));

    const users = await User.find({});
    console.log("Users:", users.map(u => `${u.name} (${u.role}) Verified: ${u.isVerified}`));

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

run();
