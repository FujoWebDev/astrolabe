import { rest } from "msw";

export const handlers = [
  // Handles a GET /user request
  rest.get(
    // TODO: add the "iframely" server in front of here
    "https://twitter.com/horse_ebooks/status/218439593240956928",
    (req, res, ctx) => {
      return res(
        ctx.delay(1000),
        ctx.status(200),
        ctx.json({
          content: {
            text: "eirika is too precious #FireEmblem https://t.co/RAx51Gf1lv",
            created_at: "2022-07-14T20:04:38.000Z",
          },
          author: {
            username: "Mari48240422",
            profile_image_url:
              "https://pbs.twimg.com/profile_images/1449659342756610049/rE2-GNUT_normal.jpg",
            name: "🌿SeaSunSmasher | open comms",
          },
        })
      );
    }
  ),
];
