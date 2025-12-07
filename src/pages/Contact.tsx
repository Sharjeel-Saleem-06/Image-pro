import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import {
  Mail,
  MessageCircle,
  Star,
  Send,
  CheckCircle,
  Heart,
  Users,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Phone,
  MapPin,
  Clock,
  Headphones,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Award,
  Building,
  Calendar,
  MessageSquare,
  HelpCircle,
  User,
  Briefcase,
  Code,
  Palette,
  Target,
  Lightbulb,
  Coffee,
  X
} from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  category: string;
  priority: string;
  message: string;
  rating: number;
  newsletter: boolean;
}

interface TeamMember {
  name: string;
  role: string;
  email: string;
  avatar: string;
  expertise: string[];
  bio: string;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
    rating: 0,
    newsletter: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [faqCategory, setFaqCategory] = useState('all');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', message: 'Hi! How can I help you today?', time: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const teamMembers: TeamMember[] = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      email: 'sarah@imagepro.com',
      avatar: '👩‍💼',
      expertise: ['Product Strategy', 'User Experience', 'Feature Planning'],
      bio: 'Leading product development with 8+ years in image processing tools.'
    },
    {
      name: 'Alex Chen',
      role: 'Lead Developer',
      email: 'alex@imagepro.com',
      avatar: '👨‍💻',
      expertise: ['AI/ML', 'Image Processing', 'Web Development'],
      bio: 'Expert in computer vision and AI-powered image enhancement algorithms.'
    },
    {
      name: 'Maria Rodriguez',
      role: 'Customer Success',
      email: 'maria@imagepro.com',
      avatar: '👩‍🎨',
      expertise: ['Customer Support', 'Training', 'User Onboarding'],
      bio: 'Dedicated to ensuring every user has an amazing experience with ImagePro.'
    },
    {
      name: 'David Kim',
      role: 'Security Engineer',
      email: 'david@imagepro.com',
      avatar: '👨‍🔧',
      expertise: ['Data Security', 'Privacy', 'Infrastructure'],
      bio: 'Ensuring your data stays safe with enterprise-grade security measures.'
    }
  ];

  const faqs: FAQ[] = [
    {
      question: 'Is ImagePro completely free to use?',
      answer: 'Yes! ImagePro is 100% free with no hidden costs, subscription fees, or usage limits. All features including AI enhancement, background removal, and format conversion are available at no charge.',
      category: 'pricing',
      helpful: 245
    },
    {
      question: 'How secure is my uploaded data?',
      answer: 'Your privacy is our top priority. All images are processed locally in your browser when possible, and any server processing is done with end-to-end encryption. Images are automatically deleted within 15 minutes and never stored permanently.',
      category: 'security',
      helpful: 189
    },
    {
      question: 'What image formats are supported?',
      answer: 'We support 50+ formats including PNG, JPEG, GIF, WebP, BMP, TIFF, SVG, PDF, HEIC, and many more. Our converter can handle both common and specialized formats.',
      category: 'features',
      helpful: 156
    },
    {
      question: 'Can I use ImagePro for commercial projects?',
      answer: 'Absolutely! ImagePro is free for both personal and commercial use. There are no licensing restrictions or attribution requirements.',
      category: 'licensing',
      helpful: 134
    },
    {
      question: 'How does the AI enhancement work?',
      answer: 'Our AI uses advanced machine learning models including neural networks for upscaling, background removal, and style transfer. Processing happens client-side when possible for maximum privacy and speed.',
      category: 'features',
      helpful: 198
    },
    {
      question: 'Is there a file size limit?',
      answer: 'For optimal performance, we recommend files under 50MB. Larger files may take longer to process but are generally supported depending on your device capabilities.',
      category: 'technical',
      helpful: 87
    },
    {
      question: 'Do you offer API access?',
      answer: 'We\'re currently developing API access for developers and businesses. Join our newsletter to be notified when it becomes available.',
      category: 'technical',
      helpful: 76
    },
    {
      question: 'How can I report a bug or suggest a feature?',
      answer: 'Use our contact form with the "Bug Report" or "Feature Request" category. We review all submissions and prioritize based on user feedback.',
      category: 'support',
      helpful: 92
    }
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get detailed help via email',
      contact: 'support@imagepro.com',
      response: 'Usually within 24 hours',
      color: 'from-blue-500 to-cyan-500',
      action: () => window.open('mailto:support@imagepro.com')
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Instant help when you need it',
      contact: 'Chat with our team',
      response: 'Available 9 AM - 6 PM EST',
      color: 'from-green-500 to-emerald-500',
      action: () => setChatOpen(true)
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+1 (555) 123-4567',
      response: 'Mon-Fri, 9 AM - 6 PM EST',
      color: 'from-purple-500 to-pink-500',
      action: () => window.open('tel:+15551234567')
    },
    {
      icon: Github,
      title: 'GitHub Issues',
      description: 'Report bugs and request features',
      contact: 'github.com/imagepro/issues',
      response: 'Community-driven support',
      color: 'from-gray-600 to-gray-800',
      action: () => window.open('https://github.com/imagepro/issues')
    }
  ];

  const businessInfo = {
    company: 'ImagePro Technologies Inc.',
    address: '123 Innovation Drive, Suite 400, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    email: 'hello@imagepro.com',
    hours: 'Monday - Friday: 9:00 AM - 6:00 PM PST',
    founded: '2023',
    employees: '15-50',
    headquarters: 'San Francisco, CA'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSubmitted(true);
    setIsSubmitting(false);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
        rating: 0,
        newsletter: false
      });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRating = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { type: 'user', message: chatInput, time: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "Thanks for your message! A team member will respond shortly.",
        "I understand your question. Let me connect you with the right person.",
        "That's a great question! You can find more info in our FAQ section.",
        "I'll make sure our team sees this. Is there anything else I can help with?"
      ];
      const botMessage = {
        type: 'bot',
        message: responses[Math.floor(Math.random() * responses.length)],
        time: new Date()
      };
      setChatMessages(prev => [...prev, botMessage]);
    }, 1000);
    
    setChatInput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredFAQs = faqCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === faqCategory);

  const faqCategories = [
    { id: 'all', label: 'All Questions', count: faqs.length },
    { id: 'pricing', label: 'Pricing', count: faqs.filter(f => f.category === 'pricing').length },
    { id: 'features', label: 'Features', count: faqs.filter(f => f.category === 'features').length },
    { id: 'security', label: 'Security', count: faqs.filter(f => f.category === 'security').length },
    { id: 'technical', label: 'Technical', count: faqs.filter(f => f.category === 'technical').length },
    { id: 'support', label: 'Support', count: faqs.filter(f => f.category === 'support').length }
  ];

  return (
    <Layout>
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Get in Touch
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              We're here to help! Whether you have questions, feedback, or need support, 
              our team is ready to assist you.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { label: 'Response Time', value: '< 24h', icon: Clock },
                { label: 'Satisfaction', value: '98%', icon: Star },
                { label: 'Team Members', value: '15+', icon: Users },
                { label: 'Languages', value: '12', icon: Globe }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Our Team
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company
              </TabsTrigger>
            </TabsList>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
                <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-6 h-6" />
                    Send us a Message
                  </CardTitle>
                        <p className="text-gray-600 dark:text-gray-300">
                          Fill out the form below and we'll get back to you as soon as possible.
                        </p>
                </CardHeader>
                      <CardContent>
                        {submitted ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-12"
                          >
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              Thank you for contacting us. We'll respond within 24 hours.
                            </p>
                          </motion.div>
                        ) : (
                          <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                                  className="mt-1"
                                  placeholder="John Doe"
                                />
                      </div>
                              <div>
                                <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                                  className="mt-1"
                                  placeholder="john@example.com"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="company">Company (Optional)</Label>
                                <Input
                                  id="company"
                                  name="company"
                                  value={formData.company}
                                  onChange={handleInputChange}
                                  className="mt-1"
                                  placeholder="Your Company"
                                />
                              </div>
                              <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="general">General Inquiry</SelectItem>
                                    <SelectItem value="support">Technical Support</SelectItem>
                                    <SelectItem value="bug">Bug Report</SelectItem>
                                    <SelectItem value="feature">Feature Request</SelectItem>
                                    <SelectItem value="business">Business Inquiry</SelectItem>
                                    <SelectItem value="partnership">Partnership</SelectItem>
                                  </SelectContent>
                                </Select>
                      </div>
                    </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                                  className="mt-1"
                                  placeholder="Brief description of your inquiry"
                                />
                              </div>
                              <div>
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="message">Message *</Label>
                              <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                rows={6}
                                className="mt-1"
                                placeholder="Please provide as much detail as possible about your inquiry..."
                              />
                    </div>

                    {/* Rating */}
                            <div>
                              <Label>Rate your experience with ImagePro (optional)</Label>
                              <div className="flex gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                        <motion.button
                          key={rating}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRating(rating)}
                          className={`p-1 ${
                                      formData.rating >= rating
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  >
                                    <Star className="w-6 h-6 fill-current" />
                          </motion.button>
                                ))}
                      </div>
                    </div>

                            {/* Newsletter */}
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="newsletter"
                                name="newsletter"
                                checked={formData.newsletter}
                        onChange={handleInputChange}
                                className="rounded"
                              />
                              <Label htmlFor="newsletter" className="text-sm">
                                Subscribe to our newsletter for updates and tips
                              </Label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                              {isSubmitting ? (
                      <>
                          <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                                  />
                          Sending...
                                </>
                              ) : (
                      <>
                                  <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                              )}
                    </Button>
                  </form>
                        )}
                </CardContent>
              </Card>
            </motion.div>
                </div>

                {/* Contact Methods */}
                <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-xl font-semibold mb-4">Other Ways to Reach Us</h3>
                    {contactMethods.map((method, index) => {
                      const Icon = method.icon;
                  return (
                    <motion.div
                          key={method.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <Card 
                            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg hover:shadow-lg transition-all cursor-pointer"
                            onClick={method.action}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 bg-gradient-to-br ${method.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold">{method.title}</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{method.description}</p>
                                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{method.contact}</p>
                                  <p className="text-xs text-gray-500">{method.response}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Business Hours */}
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Business Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 6:00 PM PST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday</span>
                        <span className="font-medium">10:00 AM - 4:00 PM PST</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday</span>
                        <span className="text-gray-500">Closed</span>
                      </div>
                      <Separator className="my-3" />
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Currently Online</span>
                        </div>
                        <p>Average response time: 2-4 hours</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Our passionate team of experts is dedicated to making ImagePro the best image processing platform.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={member.name}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg hover:shadow-lg transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                            {member.avatar}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                            <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">{member.role}</p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{member.bio}</p>
                            
                            <div className="flex flex-wrap gap-1 mb-3">
                              {member.expertise.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`mailto:${member.email}`)}
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Contact
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(member.email)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Find quick answers to common questions about ImagePro.
                </p>
              </motion.div>

              {/* FAQ Categories */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {faqCategories.map((category) => (
                  <Button
                    key={category.id}
                    variant={faqCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFaqCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    {category.label}
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* FAQ List */}
              <div className="max-w-4xl mx-auto space-y-4">
                {filteredFAQs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                      <CardContent className="p-0">
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                          className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <h3 className="font-semibold pr-4">{faq.question}</h3>
                          {expandedFAQ === index ? (
                            <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        
                        {expandedFAQ === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-6 pb-6"
                          >
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{faq.answer}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Heart className="w-4 h-4" />
                                <span>{faq.helpful} people found this helpful</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {faq.category}
                              </Badge>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Company Info Tab */}
            <TabsContent value="info" className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold mb-4">About ImagePro</h2>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Learn more about our company, mission, and values.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Company Details */}
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-6 h-6" />
                      Company Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{businessInfo.company}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Legal Entity</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-medium">Headquarters</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{businessInfo.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{businessInfo.phone}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Main Office</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{businessInfo.email}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">General Inquiries</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Founded {businessInfo.founded}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Company Established</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                {/* Mission & Values */}
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-6 h-6" />
                      Our Mission
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Vision
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        To democratize professional image processing tools and make them accessible to everyone, everywhere.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Privacy First
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Your data privacy is our top priority. We process images locally when possible and never store your files permanently.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Innovation
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        We continuously integrate the latest AI and machine learning technologies to provide cutting-edge features.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Community
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        We believe in building tools that bring people together and help them express their creativity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Social Links */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-6 h-6" />
                    Connect With Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {[
                      { icon: Github, href: 'https://github.com/imagepro', label: 'GitHub', color: 'hover:text-gray-900' },
                      { icon: Twitter, href: 'https://twitter.com/imagepro', label: 'Twitter', color: 'hover:text-blue-500' },
                      { icon: Linkedin, href: 'https://linkedin.com/company/imagepro', label: 'LinkedIn', color: 'hover:text-blue-600' }
                    ].map((social) => {
                      const Icon = social.icon;
                      return (
                        <motion.a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 ${social.color} transition-colors`}
                        >
                          <Icon className="w-5 h-5" />
                          {social.label}
                        </motion.a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Live Chat Widget */}
          {chatOpen && (
                  <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="fixed bottom-4 right-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border z-50"
            >
              <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">Live Chat</span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col h-80">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg, index) => (
                    <div
                    key={index}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                          msg.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
          </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendChatMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
          </motion.div>
          )}

          {/* Floating Chat Button */}
          {!chatOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setChatOpen(true)}
              className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
            >
              <MessageCircle className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Contact;