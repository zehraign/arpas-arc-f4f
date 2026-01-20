import { ContentTypesData } from "../types/contentTypesData";
import { SceneData } from "../types/objectData";
import { TopicData } from "../types/topicData";

// thanks gpt

export const ContentTypes: ContentTypesData = {
    variant_content_type_id: 74,
    comments_content_type_id: 122,
};

export const BenchScene: SceneData = {
    objects: [
        {
            id: 100,
            name: "Campus Entry",
            qr_id: "campus-entry",
            coordinates: [52.4570181643306, 13.526393269931924, 0],
            comments: [],
            variants: [
                {
                    id: 1,
                    name: "Campus Station Placeholder",
                    description: "Placeholder for the Campus Entry station.",
                    mesh_id: "primitive_cube",
                    mesh_url: null,
                    offset_position: [1, 1, 1],
                    offset_rotation: [0, 0, 0],
                    offset_scale: [1.2, 0.2, 0.05],
                    weight: 1,
                    likes: 0,
                    isLiked: false,
                    dislikes: 0,
                    isDisliked: false,
                },
            ],
        },
        {
            id: 101,
            name: "Cafeteria",
            qr_id: "cafeteria",
            coordinates: [52.45573, 13.52483, 0],
            comments: [],
            variants: [
                {
                    id: 1,
                    name: "Cafeteria Station Placeholder",
                    description: "Placeholder for the Cafeteria station.",
                    mesh_id: "primitive_cube",
                    mesh_url: null,
                    offset_position: [1, 1, 1],
                    offset_rotation: [0, 0, 0],
                    offset_scale: [1.2, 0.2, 0.05],
                    weight: 1,
                    likes: 0,
                    isLiked: false,
                    dislikes: 0,
                    isDisliked: false,
                },
            ],
        },
        { // duaa koordinaten  "lat": 52.540636660690225, "lon":13.391817612557453 , zehra 52.451405444313316, 13.477409860925572
            // h  52.540636660690225, 13.391817612557453
            id: 206,
            name: "Library Algen Tank",
            qr_id: "library-algen-tank",
            coordinates: [52.45510590524545, 13.525163019961198 , 0],
            comments: [],
            variants: [
                {
                    id: 1,
                    name: "Algentanks",
                    description: "Algentanks GLB at Library location.",
                    mesh_id: "models/Algentanks.glb",
                    mesh_url: `${import.meta.env.BASE_URL}models/Algentanks2.glb`,
                    offset_position: [0, 0, 0], 
                    offset_rotation: [0, 0, 0],
                    offset_scale: [15, 15, 15],
                    weight: 1,
                    likes: 0,
                    isLiked: false,
                    dislikes: 0,
                    isDisliked: false,
                },
            ],
        },
        
    ],
    id: 0,
    object_id: 0,
    content_type: 0,
};

export const BenchTopic: TopicData = {
    id: 404,
    slug: "topic-404",
    name: "Topic #404",
    description: "<figure class=\"image\"><img style=\"aspect-ratio:4000/6000;\" src=\"/media/uploads/admin/2025/05/20/shai-pal-0sPzcUzpEds-unsplash.jpg\" alt=\"Park benches in a sunny park\" width=\"4000\" height=\"6000\"></figure><p><i>Explore and give feedback on new park bench designs in your neighborhood using Augmented Reality. Your opinion matters for future public spaces!</i>&nbsp;</p>",
    category: "Public Space Development",
    labels: ["AR Feedback", "Urban Furniture", "Community Participation", "Local Parks"],
    module: 1,
    created: "2025-05-21T11:00:00.000000+02:00",
};
