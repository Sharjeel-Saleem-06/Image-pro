import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { getStatsSummary, updateImageProcessed } from '@/lib/statsUtils';
import {
  Image,
  Wand2,
  Edit3,
  Sparkles,
  Upload,
  Download,
  Shield,
  Zap,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  FileText,
  Palette,
  Scissors,
  Brain,
  TrendingUp,
  Clock,
  Globe,
  Award
} from 'lucide-react';

const HomePage = () => {
  const [stats, setStats] = useState(getStatsSummary());
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Update stats every 5 seconds to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStatsSummary());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Upload,
      title: 'Drag & Drop Upload',
      description: 'Effortlessly upload multiple images with our intuitive drag-and-drop interface',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Wand2,
      title: 'AI-Powered Processing',
      description: 'Advanced algorithms automatically optimize your images for best results',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Edit3,
      title: 'Professional Editing',
      description: 'Full-featured editor with filters, adjustments, and creative tools',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Sparkles,
      title: 'Real-time Preview',
      description: 'See changes instantly as you edit with our lightning-fast preview engine',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Shield,
      title: '100% Private & Secure',
      description: 'All processing happens locally in your browser - your images never leave your device',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: Zap,
      title: 'Batch Processing',
      description: 'Process hundreds of images simultaneously with our optimized batch tools',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const tools = [
    {
      name: 'Image Converter',
      description: 'Convert between 12+ formats including PNG, JPG, WebP, PDF and more',
      icon: Image,
      path: '/converter',
      color: 'from-blue-500 to-cyan-500',
      features: ['12+ Formats', 'Batch Convert', 'Quality Control'],
      stats: stats.conversions
    },
    {
      name: 'Image Editor',
      description: 'Professional editing suite with filters, adjustments, and creative tools',
      icon: Edit3,
      path: '/editor',
      color: 'from-green-500 to-emerald-500',
      features: ['Advanced Filters', 'Text Overlay', 'Crop & Resize'],
      stats: stats.edits
    },
    {
      name: 'OCR Text Extract',
      description: 'Extract text from images with 99%+ accuracy in 10+ languages',
      icon: FileText,
      path: '/ocr',
      color: 'from-orange-500 to-red-500',
      features: ['10+ Languages', 'High Accuracy', 'Export Options'],
      stats: stats.ocrExtractions
    },
    {
      name: 'AI Enhancer',
      description: 'AI-powered background removal, upscaling, and artistic effects',
      icon: Sparkles,
      path: '/ai-enhancer',
      color: 'from-purple-500 to-pink-500',
      features: ['Background Removal', '4x Upscaling', 'Style Transfer'],
      stats: stats.aiEnhancements
    }
  ];

  const achievements = [
    { icon: TrendingUp, label: 'Images Processed', value: stats.totalProcessed },
    { icon: Clock, label: 'Uptime', value: stats.uptime },
    { icon: Globe, label: 'Formats Supported', value: stats.formatsSupported },
    { icon: Award, label: 'Cost to Use', value: 'Free' }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Graphic Designer',
      content: 'ImagePro has revolutionized my workflow. The AI features save me hours every day!',
      rating: 5
    },
    {
      name: 'Mike Rodriguez',
      role: 'Photographer',
      content: 'The batch processing feature is incredible. I can process hundreds of photos in minutes.',
      rating: 5
    },
    {
      name: 'Emily Johnson',
      role: 'Content Creator',
      content: 'Love that everything works offline. My images stay private and the quality is amazing.',
      rating: 5
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y: y1, opacity }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
          />
          <motion.div
            style={{ y: y2, opacity }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-orange-400/20 rounded-full blur-3xl"
          />
          
          {/* Floating Elements */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              100% Free • No Registration Required
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 leading-tight">
              Transform Images
              <br />
              <span className="text-3xl md:text-5xl lg:text-6xl">with AI Power</span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed px-4">
              Professional image processing tools powered by AI. Convert, edit, enhance, and extract text from images - 
              <span className="font-semibold text-blue-600 dark:text-blue-400"> all in your browser</span>, 
              completely free and private.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link to="/converter">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Upload className="w-5 h-5 mr-2" />
                Start Processing Images
              </Button>
            </Link>
            <Link to="/about">
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                How it Works
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto px-4"
          >
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.label}
                whileHover={{ scale: 1.05 }}
                className="text-center group p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-3 md:mb-4 group-hover:shadow-lg transition-all">
                  <achievement.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 md:mb-2 min-h-[1.5rem] md:min-h-[2rem] lg:min-h-[2.5rem] flex items-center justify-center">
                  {achievement.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-xs md:text-sm lg:text-base font-medium leading-tight">
                  {achievement.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gray-50/50 to-blue-50/50 dark:from-gray-900/50 dark:to-blue-900/10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ImagePro</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Experience the future of image processing with our cutting-edge tools designed for professionals and enthusiasts alike.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all group">
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI Tools</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to process, edit, and enhance your images with cutting-edge AI technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Link to={tool.path}>
                    <Card className="h-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {tool.stats} used
                          </Badge>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                          {tool.name}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                          {tool.description}
                        </p>
                        
                        <div className="space-y-2 mb-6">
                          {tool.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                              <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform">
                          <span>Try it now</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Loved by <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Professionals</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of creators who trust ImagePro for their image processing needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Transform Your Images?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of users who trust ImagePro for their image processing needs. 
                Start processing images instantly - no registration required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/converter">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl transform hover:scale-105 transition-all"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Start Now - It's Free
                  </Button>
                </Link>
                <Link to="/about">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl transition-all"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;