import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import {
  Upload,
  Wand2,
  Download,
  Shield,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
  Code,
  Globe,
  Heart,
  Star } from
'lucide-react';

const About = () => {
  const steps = [
  {
    step: 1,
    title: 'Upload Your Image',
    description: 'Drag and drop or click to upload images in any format',
    icon: Upload,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    step: 2,
    title: 'Choose Your Tool',
    description: 'Select from conversion, editing, or AI enhancement tools',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500'
  },
  {
    step: 3,
    title: 'Process & Download',
    description: 'Let our AI work its magic and download your enhanced image',
    icon: Download,
    color: 'from-green-500 to-emerald-500'
  }];


  const features = [
  {
    title: 'No Registration Required',
    description: 'Start processing images immediately without creating an account',
    icon: Users
  },
  {
    title: 'Completely Free',
    description: 'All features are free to use with no hidden costs or limits',
    icon: Heart
  },
  {
    title: 'Privacy First',
    description: 'All processing happens locally in your browser - no images uploaded to servers',
    icon: Shield
  },
  {
    title: 'Lightning Fast',
    description: 'Powered by optimized algorithms for quick client-side processing',
    icon: Zap
  },
  {
    title: 'AI-Powered',
    description: 'Advanced machine learning running directly in your browser',
    icon: Sparkles
  },
  {
    title: 'Multi-Format Support',
    description: 'Support for 8+ image formats including PNG, JPG, WebP, PDF',
    icon: ImageIcon
  }];


  const technologies = [
    { name: 'React 18', category: 'Frontend' },
    { name: 'TypeScript', category: 'Language' },
    { name: 'Vite', category: 'Build Tool' },
    { name: 'TailwindCSS', category: 'Styling' },
    { name: 'ShadCN UI', category: 'Components' },
    { name: 'Framer Motion', category: 'Animation' },
    { name: 'Canvas API', category: 'Image Processing' },
    { name: 'Tesseract.js', category: 'OCR Engine' },
    { name: 'TensorFlow.js', category: 'AI/ML' },
    { name: 'Fabric.js', category: 'Canvas Editor' },
    { name: 'JSZip', category: 'File Handling' },
    { name: 'Cursor AI', category: 'Development' },
    { name: 'Netlify', category: 'Hosting' }
  ];


  const stats = [
  { number: '1M+', label: 'Images Processed', icon: ImageIcon },
  { number: '50+', label: 'Supported Formats', icon: Code },
  { number: '100K+', label: 'Happy Users', icon: Users },
  { number: '99.9%', label: 'Uptime', icon: Zap }];


  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16">

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ImagePro</span> Works
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Professional image processing made simple. Our AI-powered platform transforms 
              your images with just a few clicks.
            </p>
          </motion.div>

          {/* How It Works */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12">

              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple 3-Step Process</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Get professional results in minutes, no technical knowledge required
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative">

                    <Card className="h-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-8 text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-4">
                          {step.step}
                        </div>
                        <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                      </CardContent>
                    </Card>
                    
                    {index < steps.length - 1 &&
                    <div className="hidden md:block absolute top-1/2 -right-4 z-10">
                        <ArrowRight className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                    }
                  </motion.div>);

              })}
            </div>
          </section>

          {/* Features */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12">

              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose ImagePro?</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Built with privacy, performance, and ease of use in mind
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}>

                    <Card className="h-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>);

              })}
            </div>
          </section>

          {/* Stats */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">

              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Thousands</h2>
                <p className="text-xl opacity-90">Join our growing community of image processing enthusiasts</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center">

                      <Icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                      <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                      <div className="opacity-90">{stat.label}</div>
                    </motion.div>);

                })}
              </div>
            </motion.div>
          </section>

          {/* Technologies */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12">

              <h2 className="text-3xl md:text-4xl font-bold mb-4">Built with Modern Tech</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Powered by cutting-edge technologies for optimal performance
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {technologies.map((tech, index) =>
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}>

                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-4 text-center">
                      <h4 className="font-semibold text-sm mb-1">{tech.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {tech.category}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </section>

          {/* Privacy & Security */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}>

              <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-12">
                  <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-6">Your Privacy Matters</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                      We take your privacy seriously. All image processing happens locally in your browser - 
                      no images are ever uploaded to our servers, ensuring complete privacy and security.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">Client-Side Processing</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">All processing happens in your browser</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">No Data Upload</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Images never leave your device</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold mb-1">Offline Capable</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Works without internet connection</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>
      </div>
    </Layout>);

};

export default About;