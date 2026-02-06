const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    icon: { type: String },
    color: { type: String },
    subcategories: { type: mongoose.Schema.Types.Mixed }, // Temporary mixed to allow loading both types
    isActive: { type: Boolean, default: true }
});

const Category = mongoose.model('Category', categorySchema);

const migrate = async () => {
    try {
        console.log("Connecting to Mongo:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const categories = await Category.find({});
        console.log(`Found ${categories.length} categories.`);

        for (const cat of categories) {
            console.log(`Processing ${cat.name}...`);
            let modified = false;
            let newSubs = [];

            if (Array.isArray(cat.subcategories)) {
                // If it's already objects, we might skip, but let's check the first element
                if (cat.subcategories.length > 0 && typeof cat.subcategories[0] === 'string') {
                    console.log(` - Migrating strings to objects: ${cat.subcategories}`);
                    newSubs = cat.subcategories.map(s => ({
                        name: s,
                        icon: cat.icon, // Default to parent icon
                        titlePlaceholder: "Ej. Reparación general",
                        descriptionPlaceholder: "Ej. Necesito arreglar..."
                    }));
                    modified = true;
                } else {
                    console.log(" - Already objects or empty.");
                }
            }

            if (modified) {
                // We need to perform a raw update because Mongoose might fight us on type casting if we use save() with the old schema in memory?
                // Actually we defined it as Mixed above, so we can save it.
                cat.subcategories = newSubs;
                await cat.save();
                console.log(" - Saved.");
            }
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
};

migrate();
