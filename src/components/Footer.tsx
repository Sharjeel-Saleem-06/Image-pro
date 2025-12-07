import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Image } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
  { label: 'Home', path: '/' },
  { label: 'Tools', path: '/converter' },
  { label: 'OCR', path: '/ocr' },
  { label: 'About', path: '/about' }];


  const socialLinks = [
  { icon: Github, href: '#', label: 'GitHub' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' }];


  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
              <Image className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              ImagePro
            </span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center space-x-6">
            {quickLinks.map((link) =>
            <Link
              key={link.path}
              to={link.path}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">

                {link.label}
              </Link>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label={social.label}>

                  <Icon className="w-4 h-4" />
                </a>);

            })}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 ImagePro. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Built with ❤️ using <span className="font-medium text-blue-600 dark:text-blue-400">Cursor AI</span>
          </p>
        </div>
      </div>
    </footer>);

};

export default Footer;