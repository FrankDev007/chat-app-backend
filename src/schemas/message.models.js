const messageSchema = new mongoose.Schema({
    chat: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat"
    }],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    text: String,
    seenBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    delieveredTo: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, {timestamps: true});