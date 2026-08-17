import { NextResponse } from "next/server"
import { z } from "zod"

const geocodeSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = geocodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 })
    }

    const { lat, lng } = parsed.data
    const url = new URL("https://nominatim.openstreetmap.org/reverse")
    url.searchParams.set("format", "json")
    url.searchParams.set("lat", String(lat))
    url.searchParams.set("lon", String(lng))
    url.searchParams.set("zoom", "10")
    url.searchParams.set("addressdetails", "1")

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Waste2Worth-AI/1.0 (marketplace location lookup)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not look up location. Please enter it manually." },
        { status: 502 },
      )
    }

    const data = (await response.json()) as {
      address?: Record<string, string>
    }

    const address = data.address ?? {}
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      ""
    const state = address.state || address.region || ""
    const country = address.country || ""

    if (!city || !state || !country) {
      return NextResponse.json(
        { error: "Location found but city/state/country could not be determined. Please enter manually." },
        { status: 422 },
      )
    }

    return NextResponse.json({ city, state, country, lat, lng })
  } catch {
    return NextResponse.json(
      { error: "Location lookup failed. Please enter your location manually." },
      { status: 500 },
    )
  }
}
