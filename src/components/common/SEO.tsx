import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
}

const SEO: React.FC<SEOProps> = ({ 
    title, 
    description = "Check out my professional portfolio.", 
    image, 
    url,
    type = 'website'
}) => {
    // Fallback to a default site image if none provided
    const siteImage = image || '/default-og-image.jpg'; 
    const siteUrl = url || window.location.href;
    const siteTitle = `${title} | Portfolio`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={siteUrl} />

            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {image && <meta property="og:image" content={image} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={siteUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {image && <meta name="twitter:image" content={image} />}
        </Helmet>
    );
};

export default SEO;