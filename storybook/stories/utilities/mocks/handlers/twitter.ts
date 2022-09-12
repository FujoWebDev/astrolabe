import { rest } from "msw";

export const handlers = [
  // Handles a GET /user request
  rest.get(
    // TODO: add the "iframely" server in front of here
    "https://twitter.com/horse_ebooks/status/218439593240956928",
    (req, res, ctx) => {
      return res(
        ctx.delay(),
        ctx.status(200),
        ctx.json({
          // Playground link:
          // https://oauth-playground.glitch.me/?id=findTweetsById&params=%28%27FH218439593240956928%27%7EJ7CB*cGated_at%2CA%27%7EexpansionHC.media_keyKAB.mIions.Ename*-%2C-.A%27%7Emedia7pGviewD%2Calt_text%2Ctype%2Curl%2CwFth%2CvariantKheight%27%7EE7profileD%27%29*%2Cin_Gply_to_E_F%2C-GfeGnced_Js.F7.fieldHAauthor_FB%2CIitiesCattachmIsD_image_urlEuserFidGreHs%21%27IentJtweetKs%2C%01KJIHGFEDCBA7-*_
          data: [
            {
              id: "218439593240956928",
              created_at: "2012-06-28T20:23:52.000Z",
              author_id: "174958347",
              text: "Everything happens so much",
            },
          ],
          includes: {
            users: [
              {
                profile_image_url:
                  "https://pbs.twimg.com/profile_images/1096005346/1_normal.jpg",
                username: "Horse_ebooks",
                name: "Horse ebooks",
                id: "174958347",
              },
            ],
          },
        })
      );
    }
  ),
];
