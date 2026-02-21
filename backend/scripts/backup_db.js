const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');

// Get backup directory from arguments or default to a timestamped folder in _backups
const backupDir = process.argv[2] || path.join(__dirname, '../../_backups', `current_${Date.now()}`);

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const backup = async () => {
    try {
        await connectDB();

        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`Backing up collection: ${collectionName}`);

            const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();

            const filePath = path.join(backupDir, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved ${data.length} documents to ${filePath}`);
        }

        console.log('Database backup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error backing up database:', error);
        process.exit(1);
    }
};

backup();
