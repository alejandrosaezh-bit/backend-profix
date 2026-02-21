const mongoose = require('mongoose');
try {
    const Chat = require('../backend/models/Chat');
    console.log('Chat Model:', Chat ? 'DEFINED' : 'UNDEFINED');

    const JobInteraction = require('../backend/models/JobInteraction');
    console.log('JobInteraction Model:', JobInteraction ? 'DEFINED' : 'UNDEFINED');

    if (Chat && typeof Chat.find === 'function') console.log('Chat.find is a function');
    else console.log('Chat.find is NOT a function');

    if (JobInteraction && typeof JobInteraction.find === 'function') console.log('JobInteraction.find is a function');
    else console.log('JobInteraction.find is NOT a function');

} catch (e) {
    console.error('Error requiring models:', e);
}
