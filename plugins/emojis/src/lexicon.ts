import { lx, type Infer } from "prototypey";

export const emoji = lx.lexicon("com.fujocoded.astrolabe.emoji", {
    main: lx.object({
        // A list of potential embeds that can be used to represent the emoji
        // The first one that matches the conditions of the platform should be
        // used to render the emoji.
        // If the platform doesn't support any of the embeds, the fallback should be used.
        embeds: lx.array(lx.union(["#image"]), { minLength: 1, required: true }),
        // The shortcode of the emoji. Should not include the characters used to delimit
        // the emoji in the input text. (e.g. :lennyface: should be just "lennyface")
        shortcode: lx.string({ required: true }),
        // A description of what the emoji is meant to convey when used
        description: lx.string(),
        // A fallback text to display if the emoji is not supported by the client
        fallback: lx.string(),
    }),
    image: lx.object({
        image: lx.blob({
            accept: ["image/*"],
            maxSize: 100000,
            required: true,
        }),
        alt: lx.string({ required: true }),
    })
});

export const emojiSet = lx.lexicon("com.fujocoded.astrolabe.emojiset", {
    main: lx.record({
        // @ts-ignore TODO: fix this
        key: "record-key",
        record: lx.object({
            emojis: lx.array(lx.union([lx.ref(emoji.json.id).ref]), { required: true }),
            // Where this emoji set was sourced from. May be a DID, a AtUri or a regular URL.
            sourceUri: lx.string({ format: "uri" }),
            // A description of the emoji set
            description: lx.string(),
        }),
    }),
});

export type Emoji = Infer<typeof emoji>;
export type EmojiSet = Infer<typeof emojiSet>;