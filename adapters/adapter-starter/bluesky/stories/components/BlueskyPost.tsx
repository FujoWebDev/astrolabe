import {
  EditorContent,
  EditorContext,
  useEditor,
  type EditorEvents,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { fromBlueskyPost } from "../../src/index.js";
import Logo from "./Logo.jsx";

export const BlueskyPost = ({
  record,
}: {
  record: Record<string, unknown>;
}) => {
  const editor = useEditor({
    immediatelyRender: false,
    // https://tiptap.dev/docs/guides/performance#gain-more-control-over-rendering
    shouldRerenderOnTransaction: false,
    extensions: [StarterKit],
    content: fromBlueskyPost(record, {
      resolveMentionUrl: (did) => `https://bsky.app/profile/${did}`,
    }),
    editable: false,
  });

  const value = record.value as any;
  const createdAt = new Date(value.createdAt);
  const formattedDate =
    createdAt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " at " +
    createdAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <>
      <article>
        <div className="post-header">
          <div className="profile-section">
            <img className="avatar" />
            <div className="user-info">
              <div className="display-name">A user</div>
              <div className="handle">@a-user.bsky.social</div>
            </div>
          </div>
          <div className="logo-container">
            <Logo />
          </div>
        </div>
        <EditorContext.Provider value={{ editor }}>
          <EditorContent editor={editor} role="presentation" />
        </EditorContext.Provider>
        <div className="timestamp">{formattedDate}</div>
      </article>
      <style>
        {`
        article {
          background-color: #16181c;
          color: #ffffff;
          padding: 16px 20px;
          border-radius: 16px;
          max-width: 600px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          margin: 10px;
        }
        
        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .profile-section {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          background-color: pink;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .display-name {
          font-weight: 600;
          font-size: 15px;
          color: #ffffff;
        }
        
        .handle {
          font-size: 14px;
          color: #8b949e;
        }
        
        .logo-container {
          width: 24px;
          height: 24px;
        }
        
        .logo-container svg {
          width: 100%;
          height: 100%;
        }
        
        .ProseMirror {
          outline: none;
          font-size: 15px;
          margin-bottom: 12px;
        }
        
        .ProseMirror p {
          margin: 0 0 8px 0;
        }
        
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        
        .ProseMirror a {
          color: #1d9bf0;
          text-decoration: none;
        }
        
        .ProseMirror a:hover {
          text-decoration: underline;
        }
        
        .timestamp {
          font-size: 14px;
          color: #8b949e;
          margin-top: 12px;
        }
        `}
      </style>
    </>
  );
};
