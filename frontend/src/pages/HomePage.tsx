import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auctionService } from '../services/auctionService';
import { sourceService } from '../services/sourceService';
import { HeroSection } from '../components/home/HeroSection';
import { SourceMarquee } from '../components/home/SourceMarquee';
import { SectionHeading } from '../components/home/SectionHeading';
import { DiscoverTabs } from '../components/home/DiscoverTabs';
import { BidsSpotlight } from '../components/home/BidsSpotlight';
import { HowItWorks } from '../components/home/HowItWorks';
import { AlertsCta } from '../components/home/AlertsCta';
import { StatsTicker } from '../components/dashboard/StatsTicker';
import { PopularCategories } from '../components/dashboard/PopularCategories';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { StatsTickerSkeleton } from '../components/common/SkeletonLoader';
import { Reveal } from '../components/motion/Reveal';
import { ForYouSection } from '../components/home/ForYouSection';
import { IndiaTileMap } from '../components/map/IndiaTileMap';

export const HomePage: React.FC = () => {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['auctionStats'],
    queryFn: () => auctionService.getStats(),
    staleTime: 60000
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: () => sourceService.getStates(),
    staleTime: 300000
  });

  // Real lots shown as floating preview cards in the hero
  const { data: featured = [] } = useQuery({
    queryKey: ['heroFeatured'],
    // sample (MOCK) notices never appear in the hero: it should only showcase real listings
    queryFn: async () => (await auctionService.getEndingSoon(72, 12)).filter((a) => a.source.code !== 'MOCK').slice(0, 2),
    staleTime: 60000
  });

  return (
    <div className="space-y-12 sm:space-y-16 pb-6">
      <HeroSection totalSources={stats?.overview.totalSources} liveCount={stats?.overview.liveAuctions} featured={featured} />

      <section className="-mt-8 sm:-mt-10 space-y-8">
        {isStatsLoading || !stats ? <StatsTickerSkeleton /> : <StatsTicker stats={stats.overview} />}
        <SourceMarquee />
      </section>

      <ForYouSection />

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Discover"
          title="Find what you came for, faster"
          description="Jump straight to live auctions, lots about to close, the newest GeM bids or the biggest values."
        />
        <DiscoverTabs />
      </section>

      {categories.length > 0 && (
        <section className="space-y-6">
          <SectionHeading eyebrow="Browse" title="Shop by category" description="From scrap metal to vehicles and IT equipment, start with what you deal in." action={{ to: '/categories', label: 'All categories' }} />
          <PopularCategories categories={categories} />
        </section>
      )}

      {states.length > 0 && (
        <section className="space-y-6">
          <SectionHeading eyebrow="Near you" title="Browse by state" description="Darker tiles have more notices. Tap a state to see what is on offer there." action={{ to: '/locations', label: 'All states' }} />
          <Reveal>
            <IndiaTileMap states={states} />
          </Reveal>
        </section>
      )}

      <BidsSpotlight />

      <section className="space-y-6">
        <SectionHeading eyebrow="How it works" title="From notice to bid in three steps" align="center" />
        <HowItWorks />
      </section>

      <AlertsCta />

      <Reveal>
        <DisclaimerBanner />
      </Reveal>
    </div>
  );
};
