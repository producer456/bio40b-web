#!/usr/bin/env python3
"""Generate data/bodysystems_cards.json — the "Body Systems" flashcard deck.

This is a SEPARATE deck from the objective cards (objective_cards.json). It is
organized two levels deep:

    Class unit (Nervous / Cardiovascular / Respiratory)
      -> Body area (Brain & Spinal Cord, Heart, Lungs & Airways, ...)
        -> cards, mixed kinds:
             "structure" : an anatomical structure  -> its function
             "term"      : a key term               -> its definition
             "qa"        : a short recall question   -> its answer

The body areas mirror the objective deck's body-region groupings so the two
decks stay conceptually aligned, but the CARDS here are new, self-contained
content (not reused objective cards).

Re-run:  python3 tools/gen_bodysystems_cards.py
Then the site picks it up directly (it writes into data/). No sync needed for
the web build; if you also want it in the iOS app, copy the JSON there.

Card kinds use these fronts/backs:
    (kind, front, back)
"""
import json, os

# units[].areas[].cards[] -> (kind, front, back)
DATA = [
 ("nervous", "Nervous System", "🧠", [
   ("neurons", "Neurons & Nervous Tissue", "🧠", [
     ("structure", "Dendrite",
      "The neuron's receiving process — it takes in incoming signals and carries graded potentials toward the cell body."),
     ("structure", "Axon hillock",
      "The trigger zone where graded potentials summate; if the membrane reaches threshold here, the action potential is initiated."),
     ("structure", "Myelin sheath",
      "A lipid-rich insulating wrap (from oligodendrocytes in the CNS, Schwann cells in the PNS) that speeds conduction along the axon."),
     ("structure", "Node of Ranvier",
      "A gap in the myelin sheath where voltage-gated Na+ channels cluster and the action potential regenerates, enabling saltatory conduction."),
     ("structure", "Astrocyte",
      "The most abundant CNS glial cell — it supports neurons, regulates the extracellular environment, and helps form the blood–brain barrier."),
     ("term", "Resting membrane potential",
      "The ~−70 mV charge difference across a resting neuron's membrane, set mainly by the Na+/K+ pump and K+ leak channels."),
     ("term", "Saltatory conduction",
      "Rapid propagation in which the action potential 'jumps' from node to node along a myelinated axon."),
     ("term", "Neurotransmitter",
      "A chemical messenger released at a synapse that carries the signal across to the next cell."),
     ("qa", "What are the two glial cells of the PNS and their jobs?",
      "Schwann cells (myelinate/ensheath axons) and satellite cells (support and regulate neuron cell bodies in ganglia)."),
     ("qa", "Which ion rushes IN to depolarize the membrane during an action potential?",
      "Sodium (Na+), through voltage-gated Na+ channels."),
   ]),
   ("brain", "Brain & Spinal Cord", "🧠", [
     ("structure", "Cerebrum",
      "The largest brain region; its cortex handles conscious thought, sensation, voluntary movement, and language."),
     ("structure", "Cerebellum",
      "Coordinates movement, balance, and posture, and fine-tunes the timing and accuracy of motor activity."),
     ("structure", "Thalamus",
      "The relay station of the diencephalon that routes nearly all sensory and motor information to the cerebral cortex."),
     ("structure", "Hypothalamus",
      "The master homeostatic center — it controls temperature, hunger, thirst, the autonomic system, and the pituitary gland."),
     ("structure", "Medulla oblongata",
      "The lowest brain-stem region, containing the vital cardiovascular and respiratory control centers."),
     ("structure", "Choroid plexus",
      "The capillary network in the ventricles that produces cerebrospinal fluid."),
     ("term", "Gray matter",
      "Nervous tissue of neuron cell bodies, dendrites, and synapses; it forms the cortex and the nuclei of the CNS."),
     ("term", "White matter",
      "Nervous tissue made of myelinated axons; it forms the conducting tracts that carry signals between regions."),
     ("qa", "What produces cerebrospinal fluid, and where?",
      "The choroid plexus, located in the ventricles of the brain."),
     ("qa", "Name the three parts of the brain stem.",
      "Midbrain, pons, and medulla oblongata."),
     ("qa", "Which arterial ring at the base of the brain provides collateral flow?",
      "The cerebral arterial circle (circle of Willis)."),
   ]),
   ("nerves", "Peripheral & Cranial Nerves", "🔌", [
     ("structure", "Dorsal root",
      "Carries sensory (afferent) fibers INTO the spinal cord; its dorsal root ganglion holds the sensory cell bodies."),
     ("structure", "Ventral root",
      "Carries motor (efferent) fibers OUT of the spinal cord to the periphery."),
     ("structure", "Vagus nerve (CN X)",
      "The major parasympathetic nerve, supplying the heart, lungs, and digestive viscera."),
     ("term", "Mixed nerve",
      "A nerve carrying both sensory and motor fibers — all 31 pairs of spinal nerves are mixed."),
     ("term", "Nerve plexus",
      "A network where ventral rami interweave (cervical, brachial, lumbar, sacral) to form the named peripheral nerves."),
     ("qa", "How many pairs of cranial nerves and spinal nerves are there?",
      "12 pairs of cranial nerves and 31 pairs of spinal nerves."),
     ("qa", "Which cranial nerve controls the muscles of facial expression?",
      "The facial nerve (CN VII)."),
     ("qa", "Which cranial nerve carries vision?",
      "The optic nerve (CN II)."),
   ]),
   ("senses", "Special Senses (Eye & Ear)", "👁️", [
     ("structure", "Retina",
      "The neural tunic of the eye, containing the photoreceptors (rods and cones) that transduce light."),
     ("structure", "Cornea",
      "The transparent front of the fibrous tunic that refracts (bends) incoming light toward the retina."),
     ("structure", "Cochlea",
      "The spiral organ of the inner ear whose hair cells transduce sound vibrations into neural signals."),
     ("structure", "Semicircular canals",
      "Three inner-ear loops that detect rotational movement of the head for balance."),
     ("term", "Photoreceptor",
      "A retinal cell (rod or cone) that converts light into an electrical signal."),
     ("term", "Hair cell",
      "A mechanoreceptor of the inner ear whose bending stereocilia signal sound or head movement."),
     ("qa", "Which photoreceptors give color vision, and which work in dim light?",
      "Cones give color vision; rods work in dim (low-light) conditions."),
     ("qa", "Which cranial nerve carries hearing and balance?",
      "The vestibulocochlear nerve (CN VIII)."),
   ]),
   ("autonomic", "Autonomic Nervous System", "⚡", [
     ("structure", "Sympathetic chain ganglia",
      "The row of ganglia beside the spinal cord where short sympathetic preganglionic fibers synapse."),
     ("term", "Preganglionic neuron",
      "The first autonomic neuron, running from the CNS to an autonomic ganglion; it always releases acetylcholine."),
     ("term", "Sympathetic division",
      "The 'fight-or-flight' thoracolumbar division that raises heart rate, dilates pupils, and mobilizes energy."),
     ("term", "Parasympathetic division",
      "The 'rest-and-digest' craniosacral division that slows the heart and stimulates digestion."),
     ("term", "Muscarinic receptor",
      "The acetylcholine receptor on parasympathetic target organs (e.g., it slows the heart when activated)."),
     ("qa", "What neurotransmitter do most sympathetic postganglionic neurons release?",
      "Norepinephrine (the exception: sweat glands are cholinergic)."),
     ("qa", "From which spinal regions does the sympathetic division arise?",
      "The thoracolumbar region (T1–L2)."),
     ("qa", "From where does the parasympathetic division arise?",
      "The brain stem (via cranial nerves) and the sacral spinal cord — i.e., craniosacral."),
   ]),
 ]),
 ("cardio", "Cardiovascular System", "❤️", [
   ("blood", "Blood", "🩸", [
     ("structure", "Erythrocyte",
      "The biconcave, anucleate red blood cell, packed with hemoglobin to maximize oxygen transport."),
     ("structure", "Hemoglobin",
      "A protein of four globin chains, each with an iron-containing heme, that binds and carries oxygen."),
     ("structure", "Platelet",
      "An anucleate cell fragment shed from megakaryocytes that forms plugs and triggers coagulation."),
     ("term", "Hematocrit",
      "The percentage of blood volume made up of red blood cells (~45% in adults)."),
     ("term", "Plasma",
      "The fluid ~55% of blood — about 92% water carrying proteins, nutrients, wastes, and electrolytes."),
     ("term", "Hemostasis",
      "The stopping of bleeding, in three steps: vascular spasm, platelet plug formation, and coagulation."),
     ("term", "Erythropoietin",
      "The kidney hormone that stimulates red blood cell production."),
     ("qa", "What are the three formed elements of blood?",
      "Erythrocytes (red cells), leukocytes (white cells), and platelets."),
     ("qa", "Which blood type is the universal red-cell donor?",
      "Type O negative."),
     ("qa", "Which plasma protein maintains blood's osmotic pressure?",
      "Albumin."),
   ]),
   ("heart", "Heart", "❤️", [
     ("structure", "Left ventricle",
      "The thick-walled chamber that pumps oxygenated blood into the aorta and the entire systemic circuit."),
     ("structure", "SA node",
      "The heart's pacemaker, in the right atrium, that spontaneously initiates each heartbeat."),
     ("structure", "AV node",
      "The node that briefly delays the impulse before passing it to the ventricles, allowing the atria to finish emptying."),
     ("structure", "Mitral (bicuspid) valve",
      "The left atrioventricular valve that prevents backflow from the left ventricle into the left atrium."),
     ("structure", "Intercalated disc",
      "The junction joining cardiac muscle cells; its gap junctions and desmosomes let the heart contract as one unit."),
     ("term", "Cardiac output",
      "The volume of blood pumped by a ventricle per minute — heart rate × stroke volume (~5 L/min at rest)."),
     ("term", "Stroke volume",
      "The volume of blood ejected by a ventricle in one beat; set by preload, contractility, and afterload."),
     ("qa", "What does the QRS complex of an ECG represent?",
      "Ventricular depolarization (just before ventricular contraction)."),
     ("qa", "Trace deoxygenated blood from the venae cavae to the lungs.",
      "Right atrium → tricuspid valve → right ventricle → pulmonary valve → pulmonary arteries → lungs."),
     ("qa", "Which heart sound ('lub', S1) is the AV valves closing?",
      "S1, at the start of ventricular systole."),
   ]),
   ("vessels", "Blood Vessels & Circulation", "🫀", [
     ("structure", "Tunica media",
      "The middle vessel layer of smooth muscle and elastic tissue that controls vessel diameter."),
     ("structure", "Capillary",
      "The smallest vessel — a single endothelial layer — where gases, nutrients, and wastes are exchanged."),
     ("structure", "Arteriole",
      "The smallest resistance artery; its smooth muscle adjusts flow into capillaries and helps set blood pressure."),
     ("structure", "Venous valve",
      "A one-way fold of tunica intima in limb veins that prevents backflow as the muscle pump moves blood toward the heart."),
     ("term", "Blood pressure",
      "The force blood exerts on vessel walls; arterial pressure is reported as systolic/diastolic."),
     ("term", "Mean arterial pressure (MAP)",
      "The average driving pressure over the cardiac cycle ≈ diastolic pressure + ⅓ of the pulse pressure."),
     ("term", "Vasoconstriction",
      "Narrowing of a vessel by smooth-muscle contraction, which raises resistance and blood pressure."),
     ("qa", "What are the three tunics of a blood vessel wall?",
      "Tunica intima (inner endothelium), tunica media (smooth muscle), and tunica externa (connective tissue)."),
     ("qa", "At the arterial end of a capillary, does filtration or reabsorption dominate?",
      "Filtration — hydrostatic pressure exceeds colloid osmotic pressure, pushing fluid out."),
     ("qa", "Which vessel returns blood from the lower body to the right atrium?",
      "The inferior vena cava."),
   ]),
 ]),
 ("respir", "Respiratory System", "🫁", [
   ("airways", "Airways & Lungs", "🫁", [
     ("structure", "Alveolus",
      "The tiny air sac in the lung where gas exchange with the blood takes place."),
     ("structure", "Trachea",
      "The cartilage-ringed windpipe that conducts air between the larynx and the bronchi."),
     ("structure", "Bronchi",
      "The branching airways that carry air from the trachea into each lung."),
     ("structure", "Larynx",
      "The voice box, which routes air, produces sound, and guards the airway during swallowing."),
     ("structure", "Pleura",
      "The double serous membrane (visceral + parietal) whose fluid reduces friction and helps keep the lungs expanded."),
     ("term", "Respiratory zone",
      "The alveoli and alveolar ducts/sacs — the region where actual gas exchange occurs."),
     ("term", "Conducting zone",
      "The passages from nose to bronchioles that warm, filter, and move air but don't exchange gas."),
     ("qa", "What lowers alveolar surface tension so the alveoli don't collapse?",
      "Pulmonary surfactant."),
     ("qa", "Which circuit brings deoxygenated blood to the lungs?",
      "The pulmonary circuit — pulmonary arteries from the right ventricle."),
   ]),
   ("breathing", "Breathing, Gas Exchange & Transport", "💨", [
     ("structure", "Diaphragm",
      "The primary muscle of breathing; contracting flattens it, enlarging the thorax to draw air in."),
     ("term", "Tidal volume",
      "The volume of air moved in or out during a single normal breath."),
     ("term", "Vital capacity",
      "The most air that can be exhaled after a maximal inhalation."),
     ("term", "External respiration",
      "Gas exchange at the lungs — O2 diffuses into the blood and CO2 diffuses out into the alveoli."),
     ("term", "Internal respiration",
      "Gas exchange at the tissues — O2 diffuses into the cells and CO2 diffuses from the cells into the blood."),
     ("term", "Partial pressure",
      "The pressure contributed by a single gas in a mixture; gases diffuse from high to low partial pressure."),
     ("qa", "How is most oxygen carried in the blood?",
      "Bound to hemoglobin as oxyhemoglobin (~98%); only ~2% is dissolved in plasma."),
     ("qa", "How is most carbon dioxide transported?",
      "As bicarbonate ions in the plasma (~70%)."),
     ("qa", "What chiefly drives the rate of breathing?",
      "Blood CO2 and pH (and, to a lesser extent, O2), sensed by chemoreceptors."),
     ("qa", "By what process do gases cross the respiratory membrane?",
      "Simple diffusion, each gas moving down its own partial-pressure gradient."),
   ]),
 ]),
]

KICK = {"structure": "STRUCTURE → FUNCTION", "term": "KEY TERM", "qa": "QUESTION"}


def build():
    units = []
    total = 0
    for ukey, uname, uicon, areas in DATA:
        out_areas = []
        for akey, aname, aicon, cards in areas:
            out_cards = []
            counters = {}
            for kind, front, back in cards:
                assert kind in KICK, f"unknown card kind {kind!r} in area {akey}"
                counters[kind] = counters.get(kind, 0) + 1
                out_cards.append({
                    "id": f"{akey}_{kind}{counters[kind]}",
                    "kind": kind,
                    "front": front,
                    "back": back,
                })
            total += len(out_cards)
            out_areas.append({
                "key": akey, "name": aname, "icon": aicon,
                "unit": ukey, "cardCount": len(out_cards), "cards": out_cards,
            })
        units.append({
            "key": ukey, "name": uname, "icon": uicon,
            "areaCount": len(out_areas),
            "cardCount": sum(a["cardCount"] for a in out_areas),
            "areas": out_areas,
        })
    return {"generatedBy": "gen_bodysystems_cards.py", "cardCount": total, "units": units}


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "..", "data", "bodysystems_cards.json")
    doc = build()
    with open(out, "w") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
    areas = sum(u["areaCount"] for u in doc["units"])
    print(f"Wrote {doc['cardCount']} body-systems cards across "
          f"{len(doc['units'])} units / {areas} areas -> {os.path.normpath(out)}")
