import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle, AlertTriangle, Scale } from 'lucide-react';

const TermsOfService = () => {
    const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Layout>
            <div className="min-h-screen pt-20 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Last Updated: {lastUpdated}
                        </p>
                    </div>

                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-lg mb-8">
                        <CardContent className="p-8 space-y-8">
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    By accessing or using ImagePro ("the Service"), you agree to be bound by these Terms of Service. If you do not agree
                                    to these terms, please do not use our Service. ImagePro provides client-side image processing tools including conversion,
                                    editing, and OCR capabilities.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">2. Usage License</h2>
                                </div>
                                <div className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14 space-y-2">
                                    <p>ImagePro grants you a personal, non-exclusive, non-transferable license to use the Service for both personal and commercial purposes, subject to the following conditions:</p>
                                    <ul className="list-disc ml-5 space-y-1">
                                        <li>You must not use the Service for any illegal or unauthorized purpose.</li>
                                        <li>You must not attempt to reverse engineer or inspect the source code of the Service.</li>
                                        <li>You must not use the Service to process illegal or harmful content.</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">3. Disclaimer of Warranties</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. ImagePro makes no warranties, expressed or implied,
                                    regarding the reliability, accuracy, or availability of the Service. Since image processing occurs locally on your
                                    device, performance depends on your hardware capabilities. We are not responsible for any data loss or corruption
                                    that may occur during processing.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Scale className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">4. Limitation of Liability</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    In no event shall ImagePro or its developer be liable for any indirect, incidental, special, consequential, or
                                    punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses,
                                    resulting from your access to or use of or inability to access or use the Service.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
                                        <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">5. Changes to Terms</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes
                                    by updating the "Last Updated" date at the top of this page. Your continued use of the Service after any such
                                    changes constitutes your acceptance of the new Terms.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default TermsOfService;
