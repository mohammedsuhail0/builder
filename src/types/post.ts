export type PostWithTimestamp = {
  id: string;
  title: string;
  description: string;
  skills_needed: string[];
  image_urls?: string[];
  created_at: string;
  author_id: string;
  idea_timestamps: {
    posted_at: string;
    author_name: string;
    author_college: string;
  }[] | null;
};
