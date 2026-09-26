import React, { useState } from 'react';
import { Camera, Eye, X } from 'lucide-react';

const galleryPhotos = [
  {
    id: 1,
    title: "Hand-Pleated Dumplings Steaming",
    category: "Fresh Kitchen",
    url: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80",
    caption: "Fresh batches of momos steaming in bamboo and steel baskets every 15 minutes."
  },
  {
    id: 2,
    title: "Crispy Double-Crumb Fry",
    category: "Crunchy Momos",
    url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
    caption: "Golden fried crunchy momos served with creamy garlic dip."
  },
  {
    id: 3,
    title: "Smoky Charcoal Tandoor Tikka",
    category: "Tandoori Specialties",
    url: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=900&q=80",
    caption: "Charred paneer and chicken tikkas marinated in Kashmiri red chilli & curd."
  },
  {
    id: 4,
    title: "Indo-Chinese Sizzling Wok",
    category: "Fast Food",
    url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80",
    caption: "High-flame Kolkata style chowmein and spicy schezwan toss."
  },
  {
    id: 5,
    title: "Signature Gondhoraj Platter",
    category: "Mecheda Special",
    url: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=900&q=80",
    caption: "The fragrant lime momo platter that put Variety Momo on the map."
  },
  {
    id: 6,
    title: "Warm Cozy Ambiance",
    category: "Restaurant",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    caption: "Clean, hygienic, and welcoming dining space for friends and families in Mecheda."
  }
];

export default function GallerySection() {
  const [activePhoto, setActivePhoto] = useState(null);

  return (
    <section id="gallery" className="py-8 sm:py-12 bg-stone-50/60">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center max-w-lg mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Camera className="w-3.5 h-3.5 fill-brand-600 text-brand-600" />
            <span>Behind The Scenes</span>
          </div>
          <h2 className="font-outfit font-extrabold text-stone-900 text-xl sm:text-3xl tracking-tight">
            Variety Momo Gallery
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Glimpses of our sizzling kitchen, authentic pleating, and mouth-watering plates.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {galleryPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setActivePhoto(photo)}
              className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-md bg-stone-200"
            >
              <img
                src={photo.url}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 text-white">
                <span className="text-[10px] uppercase font-bold text-amber-300">
                  {photo.category}
                </span>
                <h4 className="font-outfit font-bold text-xs sm:text-sm line-clamp-1">
                  {photo.title}
                </h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setActivePhoto(null)}
            aria-hidden="true"
          />
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl z-10">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              className="w-full max-h-[70vh] object-cover"
            />
            <div className="p-4 bg-white">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                {activePhoto.category}
              </span>
              <h3 className="font-outfit font-extrabold text-lg text-stone-900 mt-0.5">
                {activePhoto.title}
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                {activePhoto.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
