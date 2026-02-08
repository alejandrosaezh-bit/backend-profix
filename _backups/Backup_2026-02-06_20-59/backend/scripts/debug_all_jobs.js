
const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

// Define Schemas INLINE to avoid registration issues in script
const UserSchema = new mongoose.Schema({}, { strict: false });
const CategorySchema = new mongoose.Schema({}, { strict: false });
const JobSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    title: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Category = mongoose.model('Category', CategorySchema);
const Job = mongoose.model('Job', JobSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const jobs = await Job.find().populate('category').populate('client');
        
        console.log(`Found ${jobs.length} jobs.`);
        
        jobs.forEach(j => {
            console.log('Job:', j.title);
            console.log('Client Email:', j.client ? j.client.email : 'N/A');
            console.log('Category:', JSON.stringify(j.category, null, 2));
            console.log('---');
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}
run();
