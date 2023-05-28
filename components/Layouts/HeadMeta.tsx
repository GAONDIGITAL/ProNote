import Head from 'next/head';

interface HeadMeta {
  title: string;
  description: string;
  url: string;
  image: string;
}

const HeadMeta = ({ title, description, url, image }: HeadMeta) => {
    return (
        <Head>
            <title>{title || 'Pro-Note'}</title>
            <meta charSet="UTF-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            <meta name="description" content={description || 'Simple Note App'} />

            <meta property="og:title" content={title || 'Pro-Note'} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image || '/assets/images/ProNoteLogo.png'} />
            <meta property="og:article:author" content="Proreef" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="original" data-rh="true" />
            <meta name="twitter:description" content={description || 'Simple Note App'} />
            <meta name="twitter:site" content={url} />
            <meta name="twitter:image" content={image || '/assets/images/ProNoteLogo.png'} />

            <link rel="icon" href="/assets/images/ProNoteLogo.png" />
        </Head>
    );
};

export default HeadMeta;