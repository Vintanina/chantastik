import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useResponsiveMobile } from '@/hooks/use-responsive-mobile';

export function LyricsListSkeleton() {
	const { isMobile, isSmallMobile } = useResponsiveMobile();

	return (
		<div className={cn('pt-0 shadow-none')}>
			<div className="p-6">
				{/* Selection banner skeleton */}
				{!isMobile && !isSmallMobile && (
					<div className="mb-4 p-3 bg-muted/20 border border-muted rounded-lg">
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-32" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-6 w-40" />
								<Skeleton className="h-8 w-28" />
							</div>
						</div>
					</div>
				)}

				{/* Lyric lines skeleton */}
				<div className="space-y-3">
					{Array.from({ length: 6 }).map((_, index) => (
						<div
							key={index}
							className="group relative rounded-lg border bg-card/50 overflow-hidden"
						>
							{isMobile || isSmallMobile ? (
								// Mobile layout: input on top, controls below
								<div className="p-3 space-y-3">
									<div className="w-full">
										<Skeleton
											className="h-10 w-full"
											style={{
												width: '100%',
											}}
										/>
									</div>
									<div className="flex gap-2 items-center justify-between">
										{/* Line number badge */}
										<Skeleton className="w-8 h-8 rounded-full shrink-0" />

										<div className="flex items-center gap-3 shrink-0">
											{/* Timestamp control */}
											<Skeleton className="h-8 w-16" />

											{/* Add line button */}
											<Skeleton className="h-8 w-8 rounded-full" />

											{/* Delete button */}
											<Skeleton className="h-8 w-8 rounded-full" />
										</div>
									</div>
								</div>
							) : (
								// Desktop layout: horizontal arrangement
								<div className="flex items-center gap-3 p-3">
									{/* Line number badge */}
									<Skeleton className="w-8 h-8 rounded-full shrink-0" />

									{/* Text input area */}
									<div className="flex-1">
										<Skeleton
											className="h-10 w-full"
											style={{
												width: `${Math.random() * 40 + 60}%`,
											}}
										/>
									</div>

									{/* Control buttons */}
									<div className="flex items-center gap-3 shrink-0">
										{/* Timestamp control */}
										<Skeleton className="h-8 w-16" />

										{/* Add line button */}
										<Skeleton className="h-8 w-8 rounded-full" />

										{/* Delete button */}
										<Skeleton className="h-8 w-8 rounded-full" />
									</div>
								</div>
							)}
						</div>
					))}
				</div>

				{/* Add line button skeleton */}
				<div className="flex justify-center mt-6">
					<Skeleton className="h-10 w-24" />
				</div>
			</div>
		</div>
	);
}
