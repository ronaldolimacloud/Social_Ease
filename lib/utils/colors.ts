/**
 * Color palette for the application
 * These colors are designed to work with the app's dark theme
 * Each color has good contrast with text
 */
export const colorPalette = [
  '#90CAC7', // Teal (app's primary accent)
  '#437C79', // Darker teal
  '#266867', // Deep teal
  '#124243', // Very dark teal
  '#7FC8CA', // Light teal
  '#5EADB0', // Medium teal
  '#6C969D', // Grayish teal
  '#28464B', // Dark slate
  '#4B7075', // Medium slate blue
  '#2C7DA0', // Dark blue
  '#468FAF', // Medium blue
  '#61A5C2', // Light blue
  '#89C2D9', // Very light blue
  '#A9D6E5', // Pale blue
  '#01949A', // Bright teal
  '#016670', // Dark teal
  '#2BA84A', // Green
  '#034C3C', // Dark green
  '#0F8261', // Medium green
  '#CA6702', // Amber
  '#BB3E03', // Burnt orange
  '#AE2012', // Red
  '#9B2226', // Dark red
  '#8B687F', // Mauve
  '#6F4A8E', // Purple
  '#5A189A', // Deep purple
];

// The color to exclude
const EXCLUDED_COLOR = '082322';

/**
 * Returns a random color from the palette, excluding the specified color
 */
export function getRandomColor(): string {
  // Filter out the excluded color if it's in the palette
  const filteredPalette = colorPalette.filter(color => 
    color.toLowerCase() !== `#${EXCLUDED_COLOR.toLowerCase()}`
  );
  
  // Get a random color from the filtered palette
  const randomIndex = Math.floor(Math.random() * filteredPalette.length);
  return filteredPalette[randomIndex];
}

/**
 * Returns a deterministic color for an ID
 * This ensures the same ID always gets the same color
 * @param id The unique identifier to get a color for
 */
export function getColorForId(id: string): string {
  // Create a simple hash from the id string
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Filter out excluded color
  const filteredPalette = colorPalette.filter(color => 
    color.toLowerCase() !== `#${EXCLUDED_COLOR.toLowerCase()}`
  );
  
  // Use positive modulo to get an index in the valid range
  const index = ((hash % filteredPalette.length) + filteredPalette.length) % filteredPalette.length;
  return filteredPalette[index];
}

/**
 * Generate a gradient array based on a base color
 * @param baseColor The base color to generate variants from
 * @returns Array of two colors for a gradient
 */
export function getGradientFromColor(baseColor: string): string[] {
  // For simplicity, just return the color and a slightly darker version
  return [baseColor, darkenColor(baseColor, 15)];
}

/**
 * Darken a hex color by a percentage
 * @param color Hex color code
 * @param percent Percentage to darken (0-100)
 */
function darkenColor(color: string, percent: number): string {
  // Remove the # if it exists
  let hex = color.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Darken
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 