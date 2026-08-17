import type { WasteListing } from "@/lib/types"

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

export function findSimilarActiveListings(
  listings: WasteListing[],
  params: {
    materialName: string
    categoryId: string
    title?: string
  },
) {
  const material = normalize(params.materialName)
  const title = params.title ? normalize(params.title) : null

  return listings.filter((listing) => {
    if (listing.status !== "active") return false
    if (listing.category_id !== params.categoryId) return false

    const listingMaterial = normalize(listing.material_name)
    const materialMatch =
      listingMaterial === material ||
      listingMaterial.includes(material) ||
      material.includes(listingMaterial)

    if (!materialMatch) return false

    if (title) {
      const listingTitle = normalize(listing.title)
      return (
        listingTitle === title ||
        listingTitle.includes(title) ||
        title.includes(listingTitle)
      )
    }

    return true
  })
}
