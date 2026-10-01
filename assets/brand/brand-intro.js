(() => {
  const intro = document.querySelector('.brand-intro');
  const lockup = intro.querySelector('.brand-lockup');
  const wordmark = intro.querySelector('.brand-wordmark');
  const arrow = intro.querySelector('.brand-arrow');
  const check = intro.querySelector('.brand-check');
  const caption = intro.querySelector('.brand-caption');
  const hint = intro.querySelector('.brand-scroll');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);
  const phase = (p, start, end) => clamp((p - start) / (end - start));
  const radius = 340;
  // Unwrap the actual logo contours into two ribbons. All points in a ribbon
  // share one spine and one camera, including the cyan overlay on the right.
  const ribbons = [...intro.querySelectorAll('.brand-ribbon')].map(group => {
    const side = group.dataset.side === 'left' ? -1 : 1;
    const paths = [...group.querySelectorAll('path')].map(element => {
      const original = element.getAttribute('d');
      const length = element.getTotalLength();
      const points = Array.from({ length: 241 }, (_, index) => {
        const point = element.getPointAtLength(length * index / 240);
        const dx = point.x - 449;
        const dy = point.y - 420;
        let theta = Math.atan2(dy, dx);
        if (side === -1 && theta > 0) theta -= Math.PI * 2;
        return { s: side * (theta + Math.PI / 2) * radius, offset: Math.hypot(dx, dy) - radius };
      });
      return { element, original, points };
    });
    paths.forEach((path, index) => {
      // The cyan cap shares the blue segment's radial band, so its colors
      // stay joined while the asymmetric right arc straightens out.
      const band = side === 1 && index === 3 ? paths[2] : path;
      const offsets = band.points.map(point => point.offset);
      const low = Math.min(...offsets);
      const high = Math.max(...offsets);
      path.points.forEach(point => {
        point.straightOffset = (point.offset - (low + high) / 2) * 140 / (high - low);
      });
    });
    return { side, paths };
  });
  let progress = 0;
  let frame = 0;
  let complete = false;
  let previousTime = 0;

  function drawRibbon(ribbon, p) {
    const delay = ribbon.side === 1 ? .055 : 0;
    const flight = easeOut(phase(p, .025 + delay, .33 + delay));
    const bend = smooth(phase(p, .27 + delay, .60 + delay));
    const zoom = mix(3.5, 1, flight);
    const viewport = innerWidth / lockup.clientWidth * 1024;
    const travel = ribbon.side * (viewport * .6 + 1100) * (1 - flight);
    ribbon.paths.forEach(({ element, original, points }) => {
      if (bend === 1) { element.setAttribute('d', original); return; }
      const contour = points.map(({ s, offset, straightOffset }, index) => {
        offset = mix(straightOffset, offset, bend);
        const angle = s / radius * bend;
        // The zero-curvature limit is a straight line. Increasing curvature
        // winds that same line into the exact original polar coordinates.
        const spineX = bend < .0001 ? s : radius / bend * Math.sin(angle);
        const spineY = bend < .0001 ? 0 : radius / bend * (1 - Math.cos(angle));
        const depth = 1 + (1 - flight) * Math.max(0, s) / 1600;
        const x = 449 + travel + ribbon.side * (spineX + Math.sin(angle) * offset) * zoom * depth;
        const y = 80 + (spineY - Math.cos(angle) * offset) * zoom * depth;
        return (index ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
      }).join('');
      element.setAttribute('d', contour + 'Z');
    });
  }

  function finish() {
    complete = true;
    cancelAnimationFrame(frame);
    frame = 0;
    const oldHeight = intro.offsetHeight;
    const oldScroll = scrollY;
    intro.classList.add('is-complete');
    ribbons.forEach(ribbon => ribbon.paths.forEach(({ element, original }) => element.setAttribute('d', original)));
    [lockup, wordmark, arrow, check].forEach(element => element.removeAttribute('style'));
    arrow.removeAttribute('transform');
    check.removeAttribute('transform');
    // Retire the pinned scroll runway while keeping the current viewport stable.
    const removedHeight = oldHeight - intro.offsetHeight;
    if (removedHeight > 0 && oldScroll > intro.offsetTop) {
      scrollTo({ top: Math.max(intro.offsetTop, oldScroll - removedHeight), behavior: 'instant' });
    }
    removeEventListener('scroll', update);
    removeEventListener('resize', update);
    reduced.removeEventListener('change', update);
  }

  function render(time = performance.now()) {
    if (complete) return;
    const length = intro.offsetHeight - innerHeight;
    const target = reduced.matches ? 1 : clamp(-intro.getBoundingClientRect().top / Math.max(1, length));
    const delta = previousTime ? Math.min(64, time - previousTime) : 16;
    previousTime = time;
    progress += (target - progress) * (1 - Math.exp(-delta / 75));
    if (Math.abs(target - progress) < .0001) progress = target;
    ribbons.forEach(ribbon => drawRibbon(ribbon, progress));

    // Seat the lower check, then drive the rising arrow from bottom-left to
    // top-right along its own shaft. No rotation or scale hides that direction.
    const seat = easeOut(phase(progress, .57, .70));
    check.setAttribute('transform', 'translate(' + -1150 * (1 - seat) + ' ' + -1150 * (1 - seat) + ')');
    check.style.opacity = progress < .57 ? '0' : '1';
    const insert = easeOut(phase(progress, .66, .81));
    arrow.setAttribute('transform', 'translate(' + -1550 * (1 - insert) + ' ' + 2140 * (1 - insert) + ')');
    arrow.style.opacity = progress < .66 ? '0' : '1';

    const reveal = smooth(phase(progress, .82, .97));
    const shift = innerWidth <= 640 ? -innerWidth * .30 : -Math.min(innerWidth * .26, 330);
    lockup.style.transform = 'translate(calc(-50% + ' + shift * reveal + 'px), -50%) scale(' + mix(1, innerWidth <= 640 ? .76 : .78, reveal) + ')';
    wordmark.style.opacity = reveal;
    wordmark.style.transform = 'translate(' + mix(-65, 0, reveal) + 'px, -50%)';
    wordmark.style.filter = reveal === 1 ? 'none' : 'blur(' + mix(12, 0, reveal) + 'px)';
    wordmark.style.clipPath = reveal === 1 ? 'none' : 'inset(0 ' + (1 - reveal) * 100 + '% 0 -40px)';
    wordmark.style.setProperty('--edge-opacity', 1 - smooth(phase(reveal, .65, 1)));
    caption.style.opacity = 1 - reveal;
    hint.style.opacity = 1 - phase(progress, 0, .12);
    if (progress >= .985 || reduced.matches) { finish(); return; }
    frame = Math.abs(target - progress) > .0001 ? requestAnimationFrame(render) : 0;
  }

  function update() {
    if (!frame && !complete) { previousTime = 0; frame = requestAnimationFrame(render); }
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  reduced.addEventListener('change', update);
  render();
})();
