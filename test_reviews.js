const mongoose = require('mongoose');
const Review = require('./backend/models/Review');
const User = require('./backend/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/profix')
.then(async () => {
    // Find Alejandro Clientes
    const client = await User.findOne({ name: 'Alejandro Clientes' });
    console.log("Client:", client._id);

    // Run same query as getClientReviews
    const allReviews = await Review.find({ reviewee: client._id, reviewerRole: 'pro' })
            .populate('reviewer', 'name avatar') // Populate básico del autor
            .populate({
                path: 'job',
                select: 'clientRated proRated status category title images workPhotos',
                populate: { path: 'category', select: 'name fullName' }
            })
            .sort({ createdAt: -1 })
            .lean();
    
    console.log("Reviews found:", allReviews.length);
    allReviews.forEach(r => {
        console.log(`Review for job ${r.job?.title}: reviewer=${r.reviewer?.name}, comment="${r.comment}"`);
    });
    process.exit(0);
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
