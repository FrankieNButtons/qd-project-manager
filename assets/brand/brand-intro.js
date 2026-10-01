(() => {
  const intro = document.querySelector('.brand-intro');
  const lockup = intro.querySelector('.brand-lockup');
  const wordmark = intro.querySelector('.brand-wordmark');
  const artwork = intro.querySelector('.brand-artwork');
  const stage = intro.querySelector('.brand-stage');
  const hero = document.querySelector('#product');
  const slot = hero.querySelector('.hero-brand-slot');
  const strokes = [...intro.querySelectorAll('.brand-stroke')];
  const caption = intro.querySelector('.brand-caption');
  const hint = intro.querySelector('.brand-scroll');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const smooth = t => t * t * (3 - 2 * t);
  const phase = (p, start, end) => clamp((p - start) / (end - start));
  const radius = 340;
  // A fixed, arc-length-parameterized hook feeds directly into the final circle.
  // Pieces translate along this rail; their contours bend around its tangent.
  function makeRail(side) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const mirror = x => side === -1 ? x : 898 - x;
    path.setAttribute('d', 'M' + mirror(-3400) + ' 650 C' + mirror(1450) + ' 800 ' + mirror(1650) + ' 80 449 80');
    const length = path.getTotalLength();
    const samples = Array.from({ length: 1201 }, (_, index) => path.getPointAtLength(length * index / 1200));
    function center(distance) {
      if (distance >= 0) {
        const angle = distance / radius;
        return { x: 449 + side * radius * Math.sin(angle), y: 420 - radius * Math.cos(angle), scale: 1 };
      }
      const fraction = Math.max(0, 1 + distance / length) * 1200;
      const index = Math.min(1199, Math.floor(fraction));
      const t = fraction - index;
      const a = samples[index];
      const b = samples[index + 1];
      const scale = 1 + 2.4 * smooth(clamp(-distance / length));
      let x = mix(a.x, b.x, t);
      let y = mix(a.y, b.y, t);
      if (distance < -length) {
        const dx = samples[1].x - samples[0].x;
        const dy = samples[1].y - samples[0].y;
        const norm = Math.hypot(dx, dy);
        x += dx / norm * (distance + length);
        y += dy / norm * (distance + length);
      }
      return { x: 449 + (x - 449) * scale, y: 420 + (y - 420) * scale, scale };
    }
    return { length, at(distance, offset) {
      const point = center(distance);
      if (distance >= 0) {
        const angle = distance / radius;
        return { x: point.x + side * Math.sin(angle) * offset, y: point.y - Math.cos(angle) * offset };
      }
      const before = center(distance - .5);
      const after = center(distance + .5);
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const norm = Math.hypot(dx, dy);
      return { x: point.x + side * dy / norm * offset * point.scale, y: point.y - side * dx / norm * offset * point.scale };
    } };
  }
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
    return { side, paths, rail: makeRail(side) };
  });
  let progress = 0;
  let frame = 0;
  let complete = false;
  let previousTime = 0;

  function drawRibbon(ribbon, p) {
    const delay = ribbon.side === 1 ? .065 : 0;
    const t = phase(p, .015 + delay, .61 + delay);
    // Keep the procession moving through the hook, then brake smoothly over
    // the last third of the trip without moving or morphing the track itself.
    const arrival = t < .65 ? t / .825 : 1 - .175 / .825 * Math.pow((1 - t) / .35, 2);
    const travel = -(ribbon.rail.length * .88 + 400) * (1 - arrival);
    ribbon.paths.forEach(({ element, original, points }) => {
      if (t === 1) { element.setAttribute('d', original); return; }
      const contour = points.map(({ s, offset, straightOffset }, index) => {
        const distance = s + travel;
        // Retain a consistent strip width during flight; recover the exact
        // asymmetric contour progressively as each point reaches the circle.
        const settle = smooth(clamp(1 + distance / 450));
        const point = ribbon.rail.at(distance, mix(straightOffset, offset, settle));
        return (index ? 'L' : 'M') + point.x.toFixed(2) + ' ' + point.y.toFixed(2);
      }).join('');
      element.setAttribute('d', contour + 'Z');
    });
  }

  function finish() {
    complete = true;
    cancelAnimationFrame(frame);
    frame = 0;
    const hadFocus = intro.contains(document.activeElement);
    hero.classList.remove('is-docking');
    hero.style.removeProperty('--dock-opacity');
    hero.style.removeProperty('--dock-offset');
    intro.remove();
    // The hero is now the first ordinary flow section. The static SVG occupies
    // exactly the rectangle reached by the animated artwork on the last frame.
    const anchor = location.hash && document.getElementById(location.hash.slice(1));
    scrollTo({ top: anchor ? anchor.offsetTop : 0, behavior: 'instant' });
    if (hadFocus) {
      hero.setAttribute('tabindex', '-1');
      hero.focus({ preventScroll: true });
    }
    removeEventListener('scroll', update);
    removeEventListener('resize', update);
    reduced.removeEventListener('change', update);
  }

  function dockBanner(amount) {
    intro.classList.toggle('is-docking', amount > 0);
    hero.classList.toggle('is-docking', amount > 0);
    stage.style.setProperty('--intro-background', 1 - amount);
    if (!amount) { artwork.style.removeProperty('transform'); return; }
    hero.style.setProperty('--dock-opacity', amount);
    hero.style.setProperty('--dock-offset', (1 - amount) * 90 + 'px');
    const destination = slot.getBoundingClientRect();
    const viewport = stage.getBoundingClientRect();
    const originX = viewport.left + viewport.width * .5;
    const originY = viewport.top + viewport.height * .48;
    const dx = destination.left + destination.width / 2 - originX;
    const dy = destination.top + destination.height / 2 - originY;
    const scale = destination.height / lockup.clientWidth;
    artwork.style.transform = 'translate(' + dx * amount + 'px, ' + dy * amount + 'px) scale(' + mix(1, scale, amount) + ')';
  }

  function render(time = performance.now()) {
    if (complete) return;
    const length = intro.offsetHeight - innerHeight;
    const target = reduced.matches ? 1 : clamp(-intro.getBoundingClientRect().top / Math.max(1, length));
    const delta = previousTime ? Math.min(64, time - previousTime) : 16;
    previousTime = time;
    progress += (target - progress) * (1 - Math.exp(-delta / 75));
    if (Math.abs(target - progress) < .0001) progress = target;
    const assembly = clamp(progress / .77);
    ribbons.forEach(ribbon => drawRibbon(ribbon, assembly));

    // Each direction vector follows its component's long axis from bottom
    // to top (negative SVG y). Start behind that vector and advance to zero.
    strokes.forEach(element => {
      const start = Number(element.dataset.start);
      const end = Number(element.dataset.end);
      const arrival = easeOut(phase(assembly, start, end));
      const dx = Number(element.dataset.dx);
      const dy = Number(element.dataset.dy);
      const distance = (1 - arrival) * 4200 / Math.hypot(dx, dy);
      element.setAttribute('transform', 'translate(' + -dx * distance + ' ' + -dy * distance + ')');
      element.style.opacity = assembly < start ? '0' : '1';
    });

    const reveal = smooth(phase(assembly, .87, .98));
    const shift = -lockup.clientWidth * 514 / 866;
    lockup.style.transform = 'translate(calc(-50% + ' + shift * reveal + 'px), -50%)';
    wordmark.style.opacity = reveal;
    wordmark.style.transform = 'translate(' + mix(-65, 0, reveal) + 'px, -50%)';
    wordmark.style.filter = reveal === 1 ? 'none' : 'blur(' + mix(12, 0, reveal) + 'px)';
    wordmark.style.clipPath = reveal === 1 ? 'none' : 'inset(0 ' + (1 - reveal) * 100 + '% 0 -40px)';
    wordmark.style.setProperty('--edge-opacity', 1 - smooth(phase(reveal, .65, 1)));
    caption.style.opacity = 1 - reveal;
    hint.style.opacity = 1 - phase(progress, 0, .12);
    const docking = smooth(phase(progress, .80, 1));
    dockBanner(docking);
    if ((target === 1 && progress === 1) || reduced.matches) { finish(); return; }
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
