"use client";

import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/** Distance en deçà de laquelle deux nœuds sont reliés. */
const LINK_DISTANCE = 170;
/** Vitesse de dérive, en pixels par milliseconde. */
const DRIFT = 0.012;

/**
 * Motif de réseau animé du panneau d'identité.
 *
 * Il figure ce que fait le produit — recouper des sources pour en faire une
 * information partagée — plutôt que de décorer avec une photographie
 * générique, qui déprécierait un outil civique.
 *
 * Volontairement discret : peu de nœuds, dérive lente, tracés très
 * transparents. L'animation s'interrompt si l'onglet passe en arrière-plan,
 * et ne démarre pas du tout si le système demande de réduire les animations.
 */
export function NetworkMotif() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let nodes: Node[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();

      width = rect.width;
      height = rect.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      // La densité suit la surface : un grand écran mérite plus de nœuds,
      // un petit ne doit pas se retrouver saturé.
      const count = Math.round(
        Math.min(30, Math.max(14, (width * height) / 26000))
      );

      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      }));
    };

    const draw = (time: number) => {
      const delta = lastTime ? Math.min(time - lastTime, 48) : 16;
      lastTime = time;

      context.clearRect(0, 0, width, height);

      for (const node of nodes) {
        node.x += node.vx * DRIFT * delta;
        node.y += node.vy * DRIFT * delta;

        // Rebond sur les bords : les nœuds restent dans le cadre sans
        // réapparaître brutalement de l'autre côté.
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distance = Math.hypot(dx, dy);

          if (distance > LINK_DISTANCE) continue;

          // Le lien s'efface à mesure que les nœuds s'éloignent.
          context.strokeStyle = `rgba(201, 149, 43, ${
            0.22 * (1 - distance / LINK_DISTANCE)
          })`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(nodes[i].x, nodes[i].y);
          context.lineTo(nodes[j].x, nodes[j].y);
          context.stroke();
        }
      }

      for (const node of nodes) {
        context.fillStyle = "rgba(212, 173, 75, 0.55)";
        context.beginPath();
        context.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
        context.fill();
      }

      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (reduceMotion) {
        // Une composition fixe, dessinée une fois : le motif reste présent
        // sans mouvement.
        draw(0);
        cancelAnimationFrame(frame);
        return;
      }
      lastTime = 0;
      frame = requestAnimationFrame(draw);
    };

    const stop = () => cancelAnimationFrame(frame);

    const handleVisibility = () => (document.hidden ? stop() : start());

    resize();
    start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
