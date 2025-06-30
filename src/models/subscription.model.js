import mongoose, {Schema} from "mongoose";

const subscriptionSchema = Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who is subscribing
        ref: "User"
    },
    subscription: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});

export const Subscription = mongoose.modal("Subscription", subscriptionSchema);