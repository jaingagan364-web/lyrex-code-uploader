# Replace the sample-call player with the uploaded video

## Changes
- Upload the supplied 1280×720 MP4 through the project asset service so it remains lightweight and deploys reliably.
- Replace only the current custom audio player inside the existing sample-call section with a responsive 16:9 video player.
- Preserve the section heading, supporting text, positioning, animation, and visual treatment.
- Remove only the headphone emoji from the two “Listen to Sample Call” buttons while preserving their text, destinations, styling, and behavior.

## Verification
- Confirm the video loads, plays smoothly with native controls, retains its aspect ratio, and has no overflow at mobile and desktop widths.
- Confirm both sample-call buttons still scroll to the same section and all other page content remains unchanged.
- Check the generated preview for build and runtime errors.

## Technical details
- The video will use `preload="metadata"`, `playsInline`, and a stable 16:9 container with `object-contain` to avoid cropping or stretching.
- No favicon files, metadata, pricing, layouts outside this section, or unrelated functionality will be changed.
