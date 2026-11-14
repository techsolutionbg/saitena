# Mobile plan animation

Mobile comparison disclosures retain native details/summary semantics, the shared name for exclusive opening, and START as the initially open plan.

Supporting browsers animate ::details-content between zero and intrinsic height over 350ms, including content-visibility as a discrete transition so closing animates as well. The enhancement is guarded by @supports; unsupported browsers retain immediate native toggling. Reduced-motion preference disables the content and chevron transitions.

During a transition, MobilePlanDisclosure keeps the activated summary at its prior viewport position. A short-lived, cancellable animation-frame tracker compensates for a preceding long plan collapsing. New toggles cancel the previous tracker in that comparison group. Wheel, touch movement, pointer and keyboard input cancel the correction immediately; unmount also cleans it up.

Reference: [Chrome for Developers: Styling details](https://developer.chrome.com/blog/styling-details).

Manual verification: opening and closing, START to BUSINESS with the activated heading remaining visible, exclusive open state, keyboard Enter, and reduced-motion instant toggling. Checked at 390px without horizontal overflow.
