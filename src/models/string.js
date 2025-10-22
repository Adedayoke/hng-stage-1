const mongoose = require('mongoose');

const stringSchema = new mongoose.Schema({
    id: String,
    value: String,
    properties: {
        length: Number,
        word_count: Number,
        sha256_hash: String,
        unique_characters: Number,
        is_palindrome: Boolean,
        character_frequency_map: Object,
    },
    created_at: String,
})

const ValueModel = mongoose.model('ValueModel', stringSchema);

module.exports = ValueModel;