<?php

namespace Database\Seeders;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeCategory;
use App\Models\User;
use Illuminate\Database\Seeder;

class KnowledgeArticlesSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::where('role', 'super_admin')->first() ?? User::first();

        // Try to load from JSON first, then fallback to parsing MD
        $articles = $this->loadArticles();

        $createdCount = 0;

        foreach ($articles as $article) {
            $categoryName = trim($article['category'] ?? '');
            $title = trim($article['title'] ?? '');
            $content = trim($article['content'] ?? '');

            // Skip if essential data missing
            if (empty($categoryName) || empty($title) || empty($content)) {
                continue;
            }

            // Find category
            $category = KnowledgeCategory::where('name', $categoryName)->first();

            if (!$category) {
                $this->command->warn("Kateqoriya tapılmadı: $categoryName");
                continue;
            }

            // Create or update article
            $slug = $this->slugify($title);

            // Extract excerpt (first meaningful line)
            $lines = array_filter(explode("\n", $content), fn($line) => !empty(trim($line)));
            $excerpt = substr(trim($lines[0] ?? $title), 0, 180);

            KnowledgeArticle::updateOrCreate(
                ['slug' => $slug],
                [
                    'knowledge_category_id' => $category->id,
                    'title' => $title,
                    'excerpt' => $excerpt,
                    'type' => 'guide',
                    'difficulty_level' => 'intermediate',
                    'is_featured' => false,
                    'content' => $this->formatContent($title, $content),
                    'tags' => json_encode([$category->slug]),
                    'author_id' => $author?->id,
                    'is_published' => true,
                    'published_at' => now(),
                ]
            );
            $createdCount++;
        }

        $this->command->info("✅ JSON faylından $createdCount məqalə yükləndi!");
    }

    private function slugify($text): string
    {
        $text = strtolower($text);
        $text = preg_replace('/[^a-z0-9\s-]/u', '', $text);
        $text = preg_replace('/[\s-]+/', '-', $text);
        return trim($text, '-');
    }

    private function formatContent($title, $content): string
    {
        // Create HTML content - preserve markdown structure
        $html = "<h2>$title</h2>\n";
        $html .= "<div class='article-body'>\n";

        // Convert markdown-style content to HTML
        $lines = explode("\n", $content);
        foreach ($lines as $line) {
            $line = htmlspecialchars($line);

            // Convert headers
            if (preg_match('/^### (.+)$/', $line, $matches)) {
                $html .= "<h3>" . trim($matches[1]) . "</h3>\n";
            }
            // Convert bold
            elseif (preg_match('/\*\*(.+?)\*\*/', $line, $matches)) {
                $html .= "<p><strong>" . trim($matches[1]) . "</strong></p>\n";
            }
            // Convert lists
            elseif (preg_match('/^- (.+)$/', $line, $matches)) {
                $html .= "<li>" . trim($matches[1]) . "</li>\n";
            }
            // Regular paragraphs
            elseif (!empty(trim($line))) {
                $html .= "<p>" . trim($line) . "</p>\n";
            }
        }

        $html .= "</div>";
        return $html;
    }

    private function loadArticles(): array
    {
        // Try JSON first
        $jsonFile = '/tmp/articles_data.json';
        if (file_exists($jsonFile)) {
            $json = file_get_contents($jsonFile);
            $articles = json_decode($json, true);
            if (is_array($articles)) {
                return $articles;
            }
        }

        // Fallback: Parse MD file directly
        $mdFile = base_path('KNOWLEDGE_BASE_ARTICLES.md');
        if (!file_exists($mdFile)) {
            return [];
        }

        $content = file_get_contents($mdFile);
        $articles = [];
        $currentCategory = null;
        $lines = explode("\n", $content);

        $i = 0;
        while ($i < count($lines)) {
            $line = $lines[$i];

            // Detect category
            if (preg_match('/^## KATEQORİYA \d+: (.+)$/', $line, $matches)) {
                $currentCategory = trim($matches[1]);
            }

            // Detect article header
            if (preg_match('/^#### (.+)$/', $line, $matches) && $currentCategory) {
                $title = trim($matches[1]);
                $contentLines = [];
                $i++;

                // Extract content until next ####
                while ($i < count($lines) && !preg_match('/^####|^## KATEQ/', $lines[$i])) {
                    if (!preg_match('/^## /', $lines[$i])) {
                        $contentLines[] = $lines[$i];
                    }
                    $i++;
                }

                $articleContent = trim(implode("\n", $contentLines));

                if (!empty($title) && !empty($articleContent) && strlen($articleContent) > 20) {
                    $articles[] = [
                        'category' => $currentCategory,
                        'title' => $title,
                        'content' => $articleContent,
                    ];
                }
                continue;
            }

            $i++;
        }

        return $articles;
    }
}
