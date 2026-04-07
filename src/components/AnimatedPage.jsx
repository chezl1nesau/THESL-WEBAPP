import React from 'react';
import { motion } from 'framer-motion';

const AnimatedPage = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="animate-page"
        >
            {children}
        </motion.div>
    );
};

export const Skeleton = ({ className, circle, text, title, rect }) => {
    let typeClass = "";
    if (circle) typeClass = "skeleton-circle";
    else if (text) typeClass = "skeleton-text";
    else if (title) typeClass = "skeleton-title";
    else if (rect) typeClass = "skeleton-rect";

    return (
        <div className={`skeleton ${typeClass} ${className || ""}`} />
    );
};

export default AnimatedPage;
