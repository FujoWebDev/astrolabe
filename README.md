# Boba Editor Next

<div align="center">

![BEN meme](./BEN.png)

Next-generation editor for BobaBoard (and beyond). Still in experimental phase.
Name subject to change.

<!-- Add the <a> so IMGs will stay on the same line -->

<a href="#"> <img alt="GitHub"
    src="https://img.shields.io/github/license/essential-randomness/boba-editor-next"
/> </a> <a href="https://gitpod.io/from-referrer/"> <img
src="https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod"
    alt="Gitpod Ready-to-Code"/> </a> <a href="https://fancoders.com/"> <img
src="https://img.shields.io/badge/fandom-coders-ff69b4" alt="Fandom Coders
badge"/> </a>

</div>

You can read a more in-depth explanation of the motivation behind and the goals of this editor in the [design README](./DESIGN.md).

## How to Use the Editor in Your Project

Check back later for the ability to install this without exploding your whole
project.

## How to Develop Locally

After forking and cloning the repo, install the editor dependencies by running `yarn install`.

You can start an auto-updating dev preview of the editor by running Storybook:

```bash
  yarn run storybook
```

This project is based on [TipTap editor](https://tiptap.dev/) which is in turn
based on [ProseMirror](https://prosemirror.net/). For help, try the [TipTap
documentation](https://tiptap.dev/introduction) first, and (if you're really
desperate) the [ProseMirror docs](https://prosemirror.net/docs/guide/).

Currently all our plugins and our editor are written in React.

```
yarn workspace [target-workspace] add [target-library]
```

For example, to add the `react-query` dependency to the main editor you can run:

```
yarn workspace @bobaboard/boba-editor-next add react-query
```

## Project Structure

This project uses [Turborepo](https://turbo.build/repo) (or tries to) to
maintain a monorepo structure. We do this so we can keep multiple related
projects in a single repository.

The top-level folder contains the following packages:

- `storybook/`: the Storybook setup that we use for development and preview
- `OutputInspectorAddon/`: the Storybook plugin we use to display the rendered
  HTML output of the editor's content.
- `src/`: the actual code for the editor and its plugins

The editor folder (`src/`) is further divided in the following sub-packages:

- `editor/`: contains the base editor, menus and some plugin presets. (Note:
  this will be further split in due time)
- `plugins/`: contains folder for each custom plugin that we created
  - `BlockWithMenu/` (internal only): A base plugin for block items (e.g.
    images, embeds) that display an additional menu for extended configuration.
  - `Image`: A plugin that allows for display of a (for now single) image. Comes
    with options like spoilers, and logic to prevent layout shifts.
  - `InlineSpoilers`: A plugin that allows the author to select text to be hidden from  
    viewers' eyes until clicked.
  - `OEmbed`: A plugin that allows loading URLs from a variety of websites as
    embeds. Needs an [iframely](https://github.com/itteco/iframely) instance to
    connect to for embed data.
  - `GifSelector` (in progress): Allows the author to search for and insert a
    GIF. Needs a [Tenor](https://developers.google.com/tenor/guides/quickstart)
    API key for GIF search. If you don't need search, you can use the regular
    Image plugin to add a GIF from a file.

### Adding external packages

Our Turborepo setup leverages yarn workspaces. To install a dependency in  
a specific package you need the name of the package you're targeting (specified
within its `package.json`).

## Plugin development

### How to add a new plugin

1. Create a new folder within `src/plugins`.
2. Create a `package.json` and a `vite.config.ts` files. Since we're using a
   monorepo, every plugin needs its own configuration. You can generally copy
   these from other plugins, but make sure to change the `name` in
   `package.json` to match your plugin's.
3. Create a `Plugin.tsx` file. This file should export a TipTap plugin that
   creates or extends either a [Mark](https://tiptap.dev/api/marks) (for inline
   formatting) or a [Node](https://tiptap.dev/api/nodes) (for content).
4. If you're creating a new type of Node, you might want to create a
   `Component.tsx` file to contain the components that are needed by the plugin.
5. Create a `index.ts` file to re-export the plugin exported by `Plugin.tsx`.

### Importing your plugin into Storybook

Before you can use your plugin with Storybook you will need to add it to the
dependencies specified in `storybook/package.json`. You can do so by copying the
`name` field in the `package.json` of the plugin and adding an additional entry
in the `dependencies` object.

Example:

```json
 "dependencies": {
    // more dependencies
    // ...
    "@bobaboard/tiptap-inline-spoilers": "*",
    // ...
    // more dependencies
 }

```

Make sure to run `yarn install` from the root directory of the project after
modifying these dependencies.

> [!NOTE]
> If you want to include a plugin within another one, you will need to
> follow a similar procedure.

### View rendering vs edit rendering vs HTML rendering

A plugin can display or output content in 3 different ways:

1. **Edit:** In this mode, the editor is being used to input content. The plugin
   might display additional interfaces that allow the author to customize the
   final content displayed in view mode. This is rendered conditionally in an
   `editable` editor by the `addNodeView()` function in the `Plugin.tsx`.
2. **View:** In this mode, the editor is being used to display content. The
   plugin might still display additional interfaces that allow the viewer to
   interact with the displayed content (for example, the option to toggle
   spoilers). This is rendered conditionally in an non-`editable` editor by the
   `addNodeView()` function in the `Plugin.tsx`.
3. **HTML:** In this mode, the editor prints out the HTML used to render the
   content created by the plugin. The HTML in the output should only contain what's  
   needed to statically display the content, without additional menus or
   interaction-only nodes. In this mode, we also include any additional data
   attribute needed to reconstruct the intended semantic of the output (for
   example, an image might include the `data-spoiler=true` attribute to indicate
   that it's meant to be initially hidden from view). This is rendered by the
   `renderHTML()` function in the `Plugin.tsx`, and the `parseHTML()` function
   should identify this type of content based on the output from `renderHTML()`.

## Contributing

Contributions are always welcome! You can check currently-planned features by
looking [at this
issue](https://github.com/essential-randomness/boba-editor-next/issues/1) or the
other issues in this repo.
