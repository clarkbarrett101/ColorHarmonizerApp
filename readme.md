# Source Code of Color Harmonizer
## Organization:
App.js is where payment status is confirmed, then loads Driver.js

Driver is a mediator that routes to the specific pages and holds cross-page data as well as overlays


masterList.mjs is a list of every trademarked paint color with relevant details


hsluv is a reletively new color space format that is hsl but the lightness of colors is consistent (pure blue is as bright pure yellow)


I prefer having icons as `<SVG>` react components so that I can color them dynamiclly

The code architecture is admittedly pretty weak with lots of duplicated code that code could be classes or types instead. By the end I was drowning in so much technical debt (as well as just incredibly bored of working on the same project for 6 months) I felt I might as well just try to lob it over the finish line and come back and drastically refactor it in 6 months to a year.

## Known Issues:
PaintChips start behind the overlay then when dragged it pulls in front, but react doesn't allow you to reorder the heirachy at runtime and zOrder doesn't work if a component is at a different level.  
PaintChips are instantiated by the pages, which are a lower tier than the overlay.  
Currently dragging a paintChip will add a clone of the chip above the overlay at the same position, but this one won't have the onDrag event, requiring the user to let go, ending the onDrag of the original chip.  
It actually will work if the same chip is dragged again because it spawn as the dragged chip from the last time.
Switching from `<View>`s to fragments `<>` might help where somehow every component and subcomponent is on the same level of the heirachy so that zOrder works properly.
Another work around in hindsignt is just have tap to select and then drag.
