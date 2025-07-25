import { toast } from 'sonner';
import type { AudioMeta, LyricLine } from './types';

export const API_BASE_URL =
	import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:8000/api';

const RENDERER_BASE_URL =
	import.meta.env.VITE_DEFAULT_RENDERER_URL || 'http://localhost:3000';

type UploadAudioResponse = {
	message: string;
	projectId: string;
	audioMetadata: AudioMeta;
};

export type Project = {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
	audioId: string;
};

type LyricsDataToUpdate = {
	text: string;
	lines: LyricLine[];
};

// get all projects function
export async function getAllProjects(): Promise<Project[]> {
	try {
		const response = await fetch(`${API_BASE_URL}/project/all`);

		if (!response.ok) {
			throw new Error('Failed to fetch projects');
		}

		const data: Project[] = await response.json();
		return data;
	} catch (error) {
		toast.error('Projects fetch failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

// update project function
export async function saveLyrics(
	id: string,
	updates: LyricsDataToUpdate
): Promise<{ lyricsId: string; projectId: string }> {
	try {
		const response = await fetch(`${API_BASE_URL}/project/${id}/lyrics`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updates),
		});

		if (!response.ok) {
			throw new Error('Failed to save lyrics');
		}

		const result: { message: string; lyricsId: string; projectId: string } =
			await response.json();

		toast.success('Lyrics saved', {
			description: 'Lyrics have been successfully saved',
		});

		return {
			lyricsId: result.lyricsId,
			projectId: result.projectId,
		};
	} catch (error) {
		toast.error('Lyrics save failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

// get lyrics for a project function
export async function getLyrics(projectId: string): Promise<{
	id: string;
	createdAt: string;
	updatedAt: string;
	text: string;
	projectId: string;
	lines: LyricLine[];
}> {
	try {
		const response = await fetch(
			`${API_BASE_URL}/project/${projectId}/lyrics`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch lyrics');
		}

		const data = await response.json();
		return data;
	} catch (error) {
		toast.error('Lyrics fetch failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

// Render video function
export async function renderVideo(params: {
	compositionId: string;
	inputProps?: Record<string, any>;
	outputFileName?: string;
	totalFrames?: number;
}): Promise<{
	success: boolean;
	message: string;
	fileName: string;
	downloadUrl: string;
}> {
	try {
		const response = await fetch(`${RENDERER_BASE_URL}/render`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Render failed');
		}

		const result = await response.json();

		toast.success('Render completed', {
			description: `Video rendered successfully: ${result.fileName}`,
		});

		return result;
	} catch (error) {
		toast.error('Render failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

// delete project function
export async function deleteProject(id: string): Promise<void> {
	try {
		const response = await fetch(`${API_BASE_URL}/project/${id}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			throw new Error('Failed to delete project');
		}

		toast.success('Project deleted', {
			description: 'Project has been successfully deleted',
		});
	} catch (error) {
		toast.error('Project deletion failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

// get audio metadata function
export async function getAudioMetadata(id: string): Promise<AudioMeta> {
	try {
		const response = await fetch(`${API_BASE_URL}/audio/${id}/meta/${id?.replace('youtube-virtual-', '')}`);

		if (!response.ok) {
			throw new Error('Failed to fetch audio metadata');
		}

		const data: AudioMeta = await response.json();
		return data;
	} catch (error) {
		toast.error('Metadata fetch failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

// get audio url function
export function getAudioUrl(id: string): string {
	return `${API_BASE_URL}/audio/${id}`;
}

// get cover art url function
export function getCoverArtUrl(id?: string): string {
	return `${API_BASE_URL}/audio/${id}/cover/${id?.replace('youtube-virtual-', '')}`;
}

/**
 * Uploads an audio file to the server
 */
export async function uploadAudioFile(
	file: File
): Promise<UploadAudioResponse> {
	const formData = new FormData();
	formData.append('audio', file);

	const response = await fetch(`${API_BASE_URL}/audio`, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Upload failed');
	}

	return response.json();
}

/**
 * Downloads a remote audio file
 * @param url URL of the audio file to download
 * @param filename Name to save the file as
 */
export async function downloadAudioFile(url: string): Promise<void> {
	try {
		// Fetch the file
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error('Failed to download file');
		}

		// Get the blob from the response
		const blob = await response.blob();

		// Extract filename from the path
		const filename = url.split('/').pop() || 'download';

		// Create a temporary download link
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = filename;

		// Trigger download and clean up
		document.body.appendChild(link);
		link.click();
		window.URL.revokeObjectURL(downloadUrl);
		document.body.removeChild(link);

		toast.success('Download started', {
			description: `Downloading ${filename}`,
		});
	} catch (error) {
		toast.error('Download failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

export type YouTubeSearchResult = {
	id: string;
	title: string;
	description: string;
	thumbnail: string;
	channelTitle: string;
	publishedAt: string;
	duration: string;
	url: string;
};

export type YouTubeSearchResponse = {
	results: YouTubeSearchResult[];
};

export type YouTubeSearchOptions = {
	query: string;
	searchType?: 'url' | 'title';
	titleQuery?: string;
};

/**
 * Search YouTube for videos
 */
export async function searchYouTube(queryOrUrl: string): Promise<YouTubeSearchResponse> {
  try {
    const serverBaseUrl =
      import.meta.env.VITE_DEV_SERVER_URL?.replace('/api', '') || 'http://localhost:8000';

    const url = new URL(`${serverBaseUrl}/youtube/search`);
    url.searchParams.set('input', queryOrUrl.trim());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`YouTube search failed: ${response.statusText}`);
    }

    const data: YouTubeSearchResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('YouTube search failed', {
      description: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}


/**
 * Create a project from YouTube video metadata without downloading audio
 */
export async function createProjectFromYouTube(video: YouTubeSearchResult): Promise<{
	projectId: string;
	message: string;
}> {
	try {
		const response = await fetch(`${import.meta.env.VITE_DEV_SERVER_URL}/youtube/from-youtube`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				videoId: video.id,
				title: video.title,
				channelTitle: video.channelTitle,
				duration: video.duration,
				thumbnail: video.thumbnail,
				url: video.url,
				description: video.description,
			}),
		});

		if (!response.ok) {
			throw new Error('Failed to create project from YouTube video');
		}

		const result = await response.json();

		toast.success('Project created!', {
			description: `Added "${video.title}" to your projects`,
		});

		return result;
	} catch (error) {
		toast.error('Project creation failed', {
			description:
				error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

/**
 * Extract lyrics from video metadata and external sources
 */
export async function extractLyricsFromVideo(videoId: string, title: string, channelTitle: string): Promise<{
	lyrics: string[];
	source: 'title' | 'description' | 'external' | 'none';
	confidence: number;
}> {
	try {
		const response = await fetch(`${API_BASE_URL}/lyrics/extract`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				videoId,
				title,
				channelTitle,
			}),
		});

		if (!response.ok) {
			throw new Error('Failed to extract lyrics');
		}

		const result = await response.json();
		return result;
	} catch (error) {
		console.warn('Lyrics extraction failed:', error);
		// Return empty result instead of throwing to allow project creation without lyrics
		return {
			lyrics: [],
			source: 'none',
			confidence: 0,
		};
	}
}
