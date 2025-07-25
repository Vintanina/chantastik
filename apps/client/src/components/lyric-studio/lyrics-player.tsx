import { Loader2, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { parseLines } from '@/remotion/Root';
import { LyricsPreviewCard } from '../lyrics-preview-card';
import { useCallback, useMemo, useState } from 'react';
import type { LyricsProps } from '@/remotion/schema';
import { VideoPlayer } from './video-player';
import { getAudioUrl, getCoverArtUrl } from '@/data/api';
import { useAppStore } from '@/stores/app/store';
import { useVideoRefContext } from '@/hooks/use-video-ref-context';
import { useAudioRefContext } from '@/hooks/use-audio-ref-context';
import { useShallow } from 'zustand/react/shallow';
import { useColorFlow } from '@/hooks/use-color-flow';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { useRenderVideo } from '@/hooks/use-render-video';
import type { AspectRatioType, AudioMeta } from '@/data/types';
import { AnimatePresence, motion } from 'motion/react';
import { RenderWhen } from '../render-when';
import { PlayerToolbar } from './player-toolbar';

export const LyricsPlayer = () => {
	const { audioRef } = useAudioRefContext();
	const { videoRef } = useVideoRefContext();

	const theme = useColorFlow();

	const { lyricLines, trackLoaded } = useAppStore(
		useShallow((state) => ({
			lyricLines: state.lyricLines,
			trackLoaded: state.trackLoaded,
		}))
	);

	const audio = useAppStore((state) => state.audio);
	const [aspectRatio, setAspectRatio] =
		useState<AspectRatioType>('horizontal');
 

	const renderVideoMutation = useRenderVideo();
	const [renderProgress, setRenderProgress] = useState<{
		type: 'bundling' | 'rendering' | 'complete' | 'error';
		progress?: number;
		message?: string;
		downloadUrl?: string;
	} | null>(null);

	const lyricsData = useCallback(() => {
		return parseLines(lyricLines);
	}, [lyricLines])();

	const totalFrames = useMemo(() => {
		if (lyricsData.length === 0) return 0;

		// Get audio duration in seconds
		const audioDuration = audioRef.current?.duration || 0;

		// Calculate frames based on audio duration (assuming 30 FPS)
		const audioFrames = Math.ceil(audioDuration * 30);

		// Get last lyric end frame
		const lastLyricFrame = lyricsData[lyricsData.length - 1].endFrame;

		// Use the maximum between audio duration and last lyric frame, plus buffer
		return Math.max(audioFrames, lastLyricFrame) + 30;
	}, [lyricsData, audioRef.current?.duration]);

	const inputProps = useMemo(() => {
		return {
			lyrics: lyricsData,
			backgroundImage: getCoverArtUrl(audio?.id ?? ''),
			theme,
		} as LyricsProps;
	}, [lyricsData]);

	const renderInputProps = useMemo(() => {
		return {
			lyrics: lyricsData,
			backgroundImage: getCoverArtUrl(audio?.id ?? ''),
			audioSrc: getAudioUrl(audio?.id ?? ''),
		} as LyricsProps;
	}, [lyricsData]);

	const handleRenderVideo = useCallback(() => {
		const storedAudioMetadata =
			localStorage.getItem(`currentAudioMetadata`);

		if (!storedAudioMetadata || lyricsData.length === 0) {
			toast.error('Cannot render video', {
				description:
					'Please ensure audio is loaded and lyrics are added',
			});
			return;
		}

		const audioMetadata: AudioMeta = JSON.parse(storedAudioMetadata);

		const fileName = `${audioMetadata.metadata?.title || 'lyrics'}-${audioMetadata.metadata?.artist || 'unknown'}.mp4`;

		// Start SSE connection for progress updates
		const eventSource = new EventSource(
			'http://localhost:3000/render-progress'
		);

		eventSource.onmessage = (event) => {
			const data = JSON.parse(event.data);
			setRenderProgress(data);

			if (data.type === 'complete') {
				toast.success('Video rendered successfully!', {
					description: 'Your lyric video is ready for download',
				});
				eventSource.close();
				setRenderProgress(null);
			} else if (data.type === 'error') {
				toast.error('Render failed', {
					description: data.message || 'Unknown error occurred',
				});
				eventSource.close();
				setRenderProgress(null);
			}
		};

		eventSource.onerror = () => {
			toast.error('Connection error', {
				description: 'Lost connection to render server',
			});
			eventSource.close();
			setRenderProgress(null);
		};

		renderVideoMutation.mutate({
			compositionId: 'LyricsPlayer',
			inputProps: renderInputProps,
			outputFileName: fileName,
			totalFrames: totalFrames,
		});
	}, [lyricsData, renderInputProps, renderVideoMutation, totalFrames]);

	if (!trackLoaded) {
		return null; // Don't render if video preview is not shown
	}

	const isRendering = renderProgress !== null;
	const progressPercentage = (renderProgress?.progress || 0) * 100;

	return (
		<Card className="pt-0 shadow-none col-span-1">
			<CardHeader className="flex flex-row items-center justify-between py-8 border-b">
				<CardTitle className="flex items-center gap-2 py-2">
					<PlayCircle className="h-5 w-5 text-primary" />
					Lyric Video Player
				</CardTitle>
				<RenderWhen
					condition={import.meta.env.VITE_NODE_ENV === 'development'}
				>
					<Button
						variant="default"
						size="sm"
						className="ml-auto relative overflow-hidden"
						onClick={handleRenderVideo}
						disabled={
							isRendering || !audio?.id || lyricsData.length === 0
						}
					>
						<AnimatePresence mode="wait">
							{isRendering ? (
								<motion.div
									key="rendering"
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									className="flex items-center"
								>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									<span>
										{renderProgress?.type === 'bundling'
											? 'Bundling...'
											: renderProgress?.type ===
												  'rendering'
												? `Rendering... ${progressPercentage}%`
												: 'Processing...'}
									</span>
								</motion.div>
							) : (
								<motion.div
									key="idle"
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									className="flex items-center"
								>
									<PlayCircle className="mr-2 h-4 w-4" />
									<span>Render</span>
								</motion.div>
							)}
						</AnimatePresence>

						{isRendering && (
							<motion.div
								className="bg-primary/10 absolute inset-0"
								initial={{ width: '0%' }}
								animate={{ width: `${progressPercentage}%` }}
								transition={{
									duration: 0.3,
									ease: 'easeInOut',
								}}
							/>
						)}
					</Button>
				</RenderWhen>
			</CardHeader>

			<CardContent className="px-6">
				<RenderWhen condition={lyricLines.length > 1}>
					<PlayerToolbar
						aspectRatio={aspectRatio}
						onAspectRatioChange={setAspectRatio}
					/>
					<VideoPlayer
						playerRef={videoRef}
						inputProps={inputProps}
						totalFrames={totalFrames}
						aspectRatio={aspectRatio}
					/>
				</RenderWhen>
				<LyricsPreviewCard />
			</CardContent>
		</Card>
	);
};
