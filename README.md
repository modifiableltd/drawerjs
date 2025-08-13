# drawerjs
Simple iOS-style drawer component, built on vanilla JS and utilizing the Bootstrap CSS style library.

## Install

Include downloaded source files in your project and include in head/footer:
```html
<link rel="stylesheet" href="drawer.css">
<script type="text/javascript" src="drawer.js">
```
**Note:** For usage with bootstrap, make sure `drawer.css` is included after your `bootstrap.css` (or similar) file

## Usage

HTML:
```html
<div class="drawer-overlay" id="exampleOverlay">
    <div class="drawer" id="exampleDrawer">
        <div class="drawer-handle"></div>
        <div class="drawer-header">
            <h5 class="drawer-title">Drawer Title</h5>
            <button type="button" class="btn-close" data-bs-dismiss="drawer" aria-label="Close"></button>
        </div>
        <div class="drawer-body">
            Drawer body; can include text, forms or any other component.
        </div>
    </div>
</div>
```

JS:
```js
 const exampleDrawer = new Drawer('#exampleDrawer', {
        backdrop: true,
        keyboard: true,
        swipeThreshold: 100,
        animationDuration: 300,
        autoFocus: true,
        showOnLoad: false,
    });
```

## Syntax

### `backdrop` *`bool`*
Toggles dismissal of the drawer by clicking on the backdrop. Default: `true`

### `keyboard` *`bool`*
Toggles keyboard events for the backdrop (tab-navigation and ESC to close). Default: `true`

### `swipeThreshold` *`int`*
Pixels required for a dragged-down drawer to close upon release. Default: `100`

### `animationDuration` *`int`*
Length in milliseconds for drawer open/close animation. Default `300` (set to `0` to disable)

### `autoFocus` *`bool`*
Toggles if the first input should be autofocused upon drawer open. Default: `true`

### `showOnLoad` *`bool`*
Toggles if the drawer should open on load (DOMContentLoaded event). Default: `false`

## About
This library was created for use in an internal project (modifiable.co.uk) and has been transformed into a standalone library. Any issues, vulnerabilities or feature requests are accepted! Under the MIT License.
