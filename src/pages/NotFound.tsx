import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import React from "react";
import Layout from "@/components/Layout";
import {
  Home,
  ArrowLeft,
  Image as ImageIcon,
  Search,
  RefreshCw } from
"lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-12">

            {/* Animated Broken Image Icon */}
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.1, 0.9, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center relative overflow-hidden">

              <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              {/* Crack effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-500/20 to-transparent transform rotate-45 translate-x-8"></div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}>

              <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-4">
                404
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                Oops! Image Not Found
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                The page you're looking for seems to have been moved, deleted, or doesn't exist. 
                But don't worry, we have plenty of amazing image tools waiting for you!
              </p>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4">

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/')}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl">

                <Home className="w-5 h-5 mr-2" />
                Go Home
              </Button>
              
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg rounded-xl border-2">

                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Button>
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Or try one of these popular tools:
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/converter')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">

                Image Converter
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/editor')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">

                Image Editor
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/ai-enhancer')}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">

                AI Enhancer
              </Button>
            </div>
          </motion.div>
          
          {/* Floating elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                rotate: [0, 5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20" />

            <motion.div
              animate={{
                y: [0, 15, 0],
                x: [0, -15, 0],
                rotate: [0, -8, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-1/3 right-1/4 w-6 h-6 bg-purple-200 dark:bg-purple-800 rounded-full opacity-20" />

            <motion.div
              animate={{
                y: [0, -25, 0],
                x: [0, 20, 0],
                rotate: [0, 10, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-pink-200 dark:bg-pink-800 rounded-full opacity-20" />

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;