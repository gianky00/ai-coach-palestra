import { type FC } from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  className = '',
}) => {
  return <div className={`skeleton-base ${className}`} style={{ width, height, borderRadius }} />;
};

export const ExerciseCardSkeleton: FC = () => {
  return (
    <div className="ex-card-premium skeleton-card" style={{ opacity: 0.6 }}>
      <div className="ex-accent-bar" style={{ background: '#333' }}></div>
      <div className="ex-content-premium">
        <Skeleton width="40px" height="10px" className="mb-2" />
        <Skeleton width="150px" height="20px" className="mb-4" />
        <div style={{ display: 'flex', gap: '20px' }}>
          <Skeleton width="40px" height="15px" />
          <Skeleton width="60px" height="15px" />
        </div>
      </div>
      <div className="ex-action-premium">
        <Skeleton width="48px" height="48px" borderRadius="16px" />
      </div>
    </div>
  );
};

export const HeatmapSkeleton: FC = () => {
  return (
    <div className="chart-card heatmap-card" style={{ marginTop: '24px', opacity: 0.6 }}>
      <div className="section-title-row" style={{ marginBottom: '20px' }}>
        <Skeleton width="100px" height="14px" />
      </div>
      <div
        className="heatmap-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '12px',
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
            }}
          >
            <Skeleton width="40px" height="10px" className="mb-2" />
            <Skeleton width="80px" height="18px" />
          </div>
        ))}
      </div>
    </div>
  );
};
