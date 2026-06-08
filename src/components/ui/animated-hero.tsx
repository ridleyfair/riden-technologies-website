"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["more leads", "more calls", "more bookings", "more growth", "more visibility"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full relative overflow-hidden bg-riden-dark">
      <div className="absolute inset-0 dot-pattern opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-riden-dark" />

      <div className="relative container mx-auto px-4 sm:px-6">
        <div className="flex gap-6 py-24 lg:py-36 items-center justify-center flex-col">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link href="/contact">
              <Button variant="secondary" size="sm" className="gap-3 rounded-full px-5 border border-riden-border">
                Built for UK tradespeople <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Headline */}
          <div className="flex gap-4 flex-col items-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl max-w-3xl tracking-tighter text-center font-bold"
            >
              <span className="text-white">Your website should bring</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-2 h-[1.2em]">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute gradient-text font-bold"
                    initial={{ opacity: 0, y: -60 }}
                    transition={{ type: "spring", stiffness: 60, damping: 14 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -80 : 80, opacity: 0 }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-lg leading-relaxed tracking-tight text-slate-400 max-w-xl text-center"
            >
              Most trade businesses rely on word of mouth alone. A professionally built website
              puts you in front of customers actively searching for your services — every day.
            </motion.p>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-row gap-3 flex-wrap justify-center"
          >
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-3">
                Book a quick call <PhoneCall className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="gradient" className="gap-3">
                Get your free demo <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export { AnimatedHero };
