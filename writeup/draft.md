# One Hundred Years of American Names as a Cultural Signal

**Issue 02 — One Hundred Years**
Draft, May 2026

---

## Abstract

We analyze 145 years of U.S. baby name data from the Social Security Administration, covering approximately 350 million recorded births and 104,819 unique names from 1880 to 2024. Using a 10-stage computational pipeline, we classify 12,481 names by wave shape, identify three statistical eras of naming through unsupervised clustering, measure a 43% increase in naming diversity over the study period, and detect the fingerprints of specific cultural events — a reality TV appearance, a Disney film, a hurricane — on parental choices. The dataset is public. The pipeline is open-source. The findings are, in places, genuinely surprising: 4,235 names have crossed gender lines, the top 10 names now account for just 4.4% of all births (down from 26.6% in 1880), and a single MTV segment in 2000 produced a 218x lift in a name that had never before appeared in the record.

This paper presents what we found, discusses what it might mean, and is honest about what it cannot tell us.

---

## Introduction

Every year, millions of American parents make roughly the same decision: what to call their child. The choice feels intimate and singular — a name for *this* baby, chosen by *these* parents. And yet, when you plot the decisions of millions of parents over more than a century, unmistakable patterns emerge. Names rise and fall in coordinated waves. Entire phonetic families — the -aidens, the -lyns — ignite and burn out together. Cultural events leave measurable scars in the data, lifting some names into sudden popularity and killing others outright.

The Social Security Administration has published annual baby name counts since 1880. The dataset is simple: a name, a gender designation, a year, and a count. Names appearing fewer than 5 times in a given year for a given gender are excluded for privacy. What remains is a record of approximately 350 million births, 104,819 unique name strings, and 116,550 name-gender pairs, spanning the full arc from the Gilded Age to the present.

We built a 10-stage computational pipeline to process this data. The pipeline classifies names by the shape of their popularity curves, clusters them into historical eras, measures diversity, detects gender crossings, tests for cultural triggers, and groups names that rise and fall together. The results are published as an interactive dashboard at [names.onehundredyears.report](https://names.onehundredyears.report).

This paper describes what we found.

### Two readings

Before presenting results, we want to name an interpretive tension that runs through all of this work.

There are two ways to read the patterns in American naming data, and the honest answer is that we cannot fully distinguish between them.

**The cultural-influence reading** holds that names are, in large part, transmitted. Parents hear a name — in a film, on a birth announcement, from a celebrity interview — and it enters their consideration set. Under this reading, the coordinated waves we observe are genuine contagion: one parent's choice influences the next. The data is a map of how culture propagates through a population.

**The latent-preference reading** holds that parents are responding independently to the same underlying aesthetic shifts. The sound of an era changes — harsher consonants give way to softer ones, or vice versa — and millions of parents, drawing from the same evolving phonetic palette, converge on similar choices without anyone copying anyone. Under this reading, the waves are not contagion but parallel expression.

The truth is almost certainly a mixture. When we show that a single MTV appearance produced a 218x lift in the name Nevaeh, the cultural-influence reading is hard to resist. When we show that dozens of -aiden names rose in lockstep across a decade, the latent-preference reading — a generation of parents independently drawn to that sound — deserves consideration alongside straightforward imitation.

We present the data. We note where one reading seems more plausible than the other. We do not pretend to have resolved the question.

---

## The Dataset

The SSA baby name dataset is, for this kind of work, unusually clean. It has been published annually since 1997 with retroactive coverage to 1880. The schema is four columns: name, gender, year, count. There are no nulls, no encoding issues, and no obvious discontinuities in the data.

There are, however, important structural features that shape any analysis:

**The 5-count floor.** Any name appearing fewer than 5 times in a given year for a given gender is suppressed. This means the dataset undercounts rare names systematically. A name used 4 times per year for 50 consecutive years — 200 real babies — would appear zero times in the record. The diversity metrics we report are therefore conservative: the true number of unique names in use is higher than what we measure.

**The gender binary.** The SSA records only male and female designations. Names are counted separately by gender, producing 116,550 name-gender pairs from 104,819 unique name strings. Our gender-crossing analysis relies on this binary categorization. We report what the data contains; we acknowledge it does not capture the full spectrum of how names are used.

**The SSA coverage window.** The Social Security Act was signed in 1935. Records before that year are reconstructed from applications filed later in life. Early-year coverage is therefore less complete, particularly for populations that were historically underserved by federal programs. The 1880–1935 segment of the data should be treated with appropriate caution.

**No demographics beyond gender and year.** The dataset contains no information about race, ethnicity, geography, religion, or socioeconomic status. We cannot distinguish a Jennifer born in Manhattan from a Jennifer born in rural Mississippi. All findings are national aggregates.

| Metric | Value |
|---|---|
| Year range | 1880–2024 |
| Total births recorded | ~350 million |
| Unique name strings | 104,819 |
| Unique name-gender pairs | 116,550 |
| Minimum count threshold | 5 per year per gender |

---

## The Shape of the Data

The first question we asked was simple: when you plot a name's popularity over 145 years, what shapes do you see?

We computed full rate-over-time vectors for every name with at least 1,000 lifetime births — 12,481 names in total. For each, we measured peak year, rise time (years from first appearance to peak), and half-life (years from peak to half of peak rate). Then we classified each name into one of five wave-shape types:

**Classic (9,285 names, 74.4%).** A slow rise, a broad peak, and a long decline. These are the names that define their eras without seeming to: William, Dorothy, Kenneth, Susan. Their half-lives are measured in decades. Many have been in continuous use for the entire 145-year record.

**Steady (882 names, 7.1%).** No pronounced peak at all. These names maintain a roughly constant rate across long stretches of the dataset. They are the background radiation of American naming: names like Thomas, Elizabeth, and Joseph, which persist without ever becoming fashionable or unfashionable.

**Flash (217 names, 1.7%).** A sharp spike followed by rapid decay. Rise times under 5 years, half-lives under 10. These are the names that feel like fads in hindsight: Khaleesi (first recorded 2011, peak 2013, approximately 560 babies at peak), or Jedidiah, or various phonetic novelties that ignited and burned out within a single cultural moment.

**Revival (29 names, 0.2%).** Two or more distinct peaks separated by a trough. The rarest shape, and the most interesting. These names had their moment, fell out of use, and then came back. The second wave is sometimes driven by a specific cultural event, sometimes by the general recycling of vintage aesthetics.

**Crossover (2,068 names, 16.6%).** Names that have appeared for both genders with 100 or more births each. These are counted separately from the other categories because the shape of their popularity curve is complicated by gender dynamics — a name may be rising for one gender while falling for another.

![Figure 1. Distribution of wave-shape types among 12,481 names with 1,000+ lifetime births.](figures/placeholder.png)

The distribution is striking. Three-quarters of all substantial names follow the Classic pattern — a single broad wave. The American name, in its typical form, is a 40-to-60-year phenomenon: a generation of parents discovers it, a generation uses it, and a generation moves on.

### Three names, three shapes

To make the wave-shape taxonomy concrete:

**Jennifer** is a textbook Classic. It appears sporadically before 1940, begins a steady rise in the 1950s, and then erupts. From 1970 to 1984, Jennifer was the single most popular female name in the United States. It peaked between 1972 and 1974 at a rate of approximately 5.6 per 1,000 births. Its half-life was 14 years — by the late 1980s, it had fallen to half its peak rate, and it has continued to decline since. Today it hovers below 0.3 per 1,000.

**Linda** is a more extreme Classic — almost a Flash. It reached an astonishing rate of 86 per 1,000 female births in 1947. To put that number in perspective: in that single year, roughly 1 in 12 baby girls born in America was named Linda. The spike was sharp and the decline was steep. No name in the modern dataset comes close to Linda's peak concentration.

**Khaleesi** is a pure Flash. The name does not exist in the SSA record before 2011, the year HBO's *Game of Thrones* premiered. It peaked in 2013 with approximately 560 babies. By the time the series ended in 2019, the name was already in decline. Its entire lifecycle — from zero to peak to fade — played out in less than a decade.

---

## The Eras of American Naming

If individual names have shapes, do those shapes cluster in time? We tested this by applying HDBSCAN — a density-based clustering algorithm that does not require a pre-specified number of clusters — to the top 500 names, represented as 145-dimensional rate vectors (one dimension per year).

The algorithm found three natural clusters:

| Cluster | Center of mass | Characteristic names |
|---|---|---|
| Victorian | ~1915 | Mary, John, William, Helen, James |
| Mid-century | ~1958 | Linda, Gary, Deborah, Karen, Larry |
| Millennial | ~2000 | Madison, Aiden, Kaylee, Brayden, Nevaeh |

The clustering is unsupervised. We did not tell the algorithm that these eras exist; it found them in the geometry of the data. The three clusters correspond roughly to three aesthetic regimes: the biblical and Anglo-Saxon solidity of the Victorian cluster, the crisp mid-century inventiveness of the postwar cluster, and the phonetically adventurous, suffix-driven creativity of the millennial cluster.

We editorially expanded the three statistical clusters into five named eras to capture finer-grained transitions:

1. **The Victorian Era (1880–1920)** — Dominated by names with deep roots in English and biblical tradition.
2. **The Interwar Transition (1920–1945)** — The old names begin to fade; new forms emerge.
3. **The Mid-Century Boom (1945–1975)** — The era of maximum name concentration. A small number of names capture enormous market share.
4. **The Diversification (1975–2000)** — The consensus fractures. Naming becomes more individualistic.
5. **The Millennial Explosion (2000–present)** — Maximum diversity. Phonetic invention. Cultural responsiveness accelerated by the internet.

The boundaries are editorial, but the underlying pattern is not. American naming has moved from convergence to divergence — from a world where a handful of names dominated to one where the field is radically open.

![Figure 2. Top-10 name share by year, 1880–2024, with era boundaries.](figures/placeholder.png)

---

## The Diversity Explosion

The single most dramatic finding in the dataset is the long-term explosion of naming diversity.

We measured diversity using Shannon entropy — a standard information-theoretic metric that captures both the number of distinct names in use and the evenness of their distribution. Higher entropy means more names, more evenly distributed.

| Year | Shannon entropy (bits) | Unique names in SSA | Top-10 share |
|---|---|---|---|
| 1880 | 8.20 | ~2,000 | 26.6% |
| 1920 | 8.55 | ~4,800 | 20.1% |
| 1960 | 9.42 | ~8,200 | 14.3% |
| 1980 | 10.12 | ~13,400 | 8.9% |
| 2000 | 11.01 | ~21,600 | 6.1% |
| 2024 | 11.75 | ~31,904 | 4.4% |

Shannon entropy rose from 8.20 bits in 1880 to 11.75 bits in 2024 — a 43% increase. The number of unique names appearing in the SSA record in a single year rose from approximately 2,000 to 31,904 — a 16x increase. The share of births captured by the 10 most popular names fell from 26.6% to 4.4%.

These three metrics tell the same story from different angles: the American name pool has exploded.

The trend is not gradual and linear. It is slow from 1880 to about 1960, then accelerates sharply. The inflection point roughly coincides with the baby boomers reaching parenting age in the late 1970s — the first generation to grow up with mass media saturation, and the generation that appears to have decisively broken the old naming consensus.

What does this mean? Under the cultural-influence reading, the explosion reflects an increase in the number of cultural inputs. More media, more exposure to diverse name pools, more raw material for parents to draw from. Under the latent-preference reading, it reflects a shift in parental values: from wanting to fit in (choosing a common, "safe" name) to wanting to stand out (choosing something distinctive). Both readings predict the observed pattern. Both are probably partially true.

What we can say with confidence is that the change is real and large. A child born in 2024 shares a classroom with a far wider variety of names than a child born in 1960. The practical experience of having an unusual name — once rare — is now the norm.

---

## Gender Crossing

Of the 104,819 unique name strings in the dataset, 4,235 have been used for both genders with at least 100 births recorded for each. This is not a marginal phenomenon. It represents a substantial fraction of the American name pool.

Gender crossing tends to be directional. The most common pattern, historically, is male-to-female: a name established as masculine is adopted for girls, often accelerates rapidly in female use, and then declines or disappears from the male side.

The canonical example is Ashley.

> **Ashley** appears in the SSA record as exclusively male through the early 20th century. In 1960, it barely registered for girls. By 1985, it was one of the most popular female names in America, and its use for boys had collapsed. The crossover was essentially complete within a single generation.

Other names that followed a similar trajectory include Leslie, Shannon, Stacy, Tracy, and Dana. The pattern is consistent enough to suggest a structural asymmetry: names move from male to female far more readily than from female to male. Once a name is perceived as feminine, it rarely returns to masculine use. The sociologist Stanley Lieberson has called this a "contamination" effect — a term we use descriptively, not normatively.

A smaller number of names exist in genuine long-term dual use. Names like Jordan, Riley, and Avery maintain substantial populations on both sides of the gender binary simultaneously, though the ratios shift over time.

![Figure 3. Ashley: male vs. female births per 1,000, 1920–2024.](figures/placeholder.png)

---

## Cultural Triggers

Can we detect the influence of specific cultural events in the naming data? We tested 18 events with known dates and plausible associated names, measuring the change in a name's rate in the years immediately following the event against its pre-event baseline.

The strongest signals:

| Event | Year | Name | Lift |
|---|---|---|---|
| MTV *Sonny with a Chance* / Nevaeh backstory | 2000 | Nevaeh | 218.54x |
| Film *Splash* | 1984 | Madison | 19.06x |
| Film *Love Story* | 1970 | Jennifer | 2.29x |
| Hurricane Katrina | 2005 | Katrina | 0.66x |

**Nevaeh** is the most extraordinary case in the dataset. The name — "heaven" spelled backward — does not appear in the SSA record before 2001. In 2000, a contestant on an MTV reality show explained that he had named his daughter Nevaeh, spelling it out for the cameras. The name entered the record the following year and rose to become one of the most popular names in the country within a decade. The lift — 218.54x over baseline — is the largest we measured for any event-name pair. This is about as close to a controlled experiment as observational naming data will ever produce: a name with zero prior usage, a single identifiable moment of national exposure, and an immediate, massive response.

**Madison** is nearly as striking. Before the 1984 film *Splash*, in which Daryl Hannah's mermaid character chooses "Madison" as her human name (the joke being that it's absurd as a first name — she got it from a street sign), Madison was vanishingly rare for girls. The 19.06x lift launched it on a trajectory that would make it one of the top 10 female names by the late 1990s.

**Jennifer** is more subtle. The name was already rising before the 1970 film *Love Story*, which featured a protagonist named Jennifer Cavilleri. The 2.29x lift we measure may overstate the film's contribution — Jennifer was caught in an existing updraft, and the film may have accelerated a trend rather than created one. This is an important methodological caution: for names that are already in motion, isolating the effect of a single event is difficult.

**Katrina** demonstrates the opposite effect. The name was in steady use before 2005. Hurricane Katrina, and the catastrophe it represented, produced a measurable decline — a 0.66x multiplier, meaning the name's rate dropped to roughly two-thirds of its pre-hurricane level. The association was toxic, and parents responded.

Of our 9 ground-truth test events (cases where the cultural link is widely documented), we detected a statistically significant signal for 6 — a 67% hit rate. The misses were generally cases where the name was already in strong motion before the event, making the signal difficult to isolate.

### Name killers

The Katrina pattern — a cultural event that suppresses rather than promotes a name — deserves its own discussion. We identified five clear cases:

| Name | Event | Year | Effect |
|---|---|---|---|
| Katrina | Hurricane Katrina | 2005 | Steady decline post-storm |
| Alexa | Amazon Echo launch | 2014 | Sharp decline; name now strongly associated with a device |
| Isis | Rise of ISIS / ISIL | 2014 | Near-total collapse |
| Karen | "Karen" meme | ~2018 | Accelerated an existing decline |
| Donald | 2016 presidential campaign | 2016 | Accelerated an existing decline |

These cases are individually fascinating and collectively unsettling. They show that a name can become culturally unusable in a matter of months. The parents who named their daughters Alexa in 2013 could not have known that within two years, the name would be synonymous with a voice-activated speaker. The parents who named their daughters Isis in 2012 — after the Egyptian goddess — could not have predicted that a terrorist organization would claim the name and make it, for a generation of American parents, impossible to use.

The asymmetry is worth noting. It takes years or decades for a name to build cultural capital. It can lose it overnight.

---

## Co-Waves and Phonetic Contagion

Do names rise and fall alone, or in groups? We applied hierarchical clustering to names' rate-over-time vectors and identified 363 co-wave groups — sets of names whose popularity trajectories are significantly correlated.

Some co-wave groups are straightforward: names that share an era peak together because they are all responding to the same generational aesthetic shift. These are real but uninteresting — they are the eras again, viewed at a finer grain.

More striking are the phonetic co-wave groups: names that share a suffix or sound pattern and whose trajectories suggest genuine contagion — one name's rise triggering the next.

### The -aiden wave

The most dramatic phonetic co-wave in the dataset is the -aiden family:

| Name | Peak year |
|---|---|
| Aiden | 2003 |
| Jayden | 2007 |
| Brayden | 2008 |
| Caden | 2008 |
| Hayden | 2007 |
| Kayden | 2010 |
| Zayden | 2014 |

The pattern is sequential. Aiden rises first; then the variants follow, each peaking a few years later. The lag structure is consistent with a contagion model: parents hear the -aiden sound, like it, and produce variations. By 2014, the pattern had reached names like Zayden — pure phonetic invention, a sound without any etymological ancestor.

### The -lyn wave

A similar pattern appears in the -lyn suffix:

| Name | Peak year |
|---|---|
| Brooklyn | 2006 |
| Brooklynn | 2010 |
| Adalynn | 2013 |
| Raelynn | 2016 |

Here the contagion is both phonetic (the -lyn sound) and orthographic (the double-n variant Brooklynn follows Brooklyn by four years, suggesting that the spelling itself became a creative template).

These co-wave groups are among the strongest evidence in the dataset for the cultural-influence reading. It is difficult to explain sequential, lagged adoption of a phonetic suffix as independent parallel preference. Something is propagating.

![Figure 4. The -aiden co-wave: births per 1,000 for selected -aiden names, 1995–2024.](figures/placeholder.png)

---

## What This Is and Isn't

This is an exploratory data analysis. We describe patterns in 145 years of naming data, classify them, and measure them. Where the patterns have plausible explanations, we discuss them. Where they don't, we say so.

This is *not* a causal study. We have not run experiments. We cannot prove that *Splash* caused the Madison boom — we can only show that Madison was rare before the film and common after it, with a timeline consistent with causation. The distinction matters.

This is not a study of *why* parents choose names. We have no survey data, no interviews, no insight into individual decision-making. We have only the aggregate output: which names were chosen, how many times, in which years.

This is not comprehensive. The SSA dataset excludes names with fewer than 5 annual occurrences, which means it systematically underrepresents rare and non-Western names. The diversity explosion we document is almost certainly larger than what we measure. The most creative margins of American naming — the truly unique choices — are invisible to us by design.

And this is not predictive. We can describe the shapes names have taken. We cannot tell you what the next Nevaeh will be. The patterns are visible only in retrospect. If naming trends were predictable, baby name consultants would be richer than they are.

---

## Known Limitations

**The 5-count threshold** suppresses rare names, biasing all diversity and frequency metrics toward popular names. Our entropy measurements are lower bounds.

**Pre-1935 data quality** is uncertain. The SSA reconstructed early records from later applications, which introduces survivorship bias — people who lived long enough to apply for Social Security cards are overrepresented.

**No geographic or demographic resolution.** National aggregates mask enormous regional, racial, ethnic, and socioeconomic variation. We know from other research that naming practices differ dramatically across these dimensions. Our data cannot speak to those differences.

**Cultural trigger attribution is observational.** We measure temporal coincidence, not causation. For events that coincide with an already-moving trend (like Jennifer and *Love Story*), the measured lift conflates the event's contribution with pre-existing momentum.

**The gender binary in the SSA data** does not reflect the full reality of how names are gendered in practice. Our gender-crossing analysis is constrained by the categories the data provides.

**The pipeline's wave-shape classification** uses heuristic thresholds (e.g., "Flash" requires a half-life under 10 years). Reasonable people could draw the boundaries differently. The taxonomy is a tool for description, not a claim about natural kinds.

**The 67% detection rate for cultural triggers** means we miss a third of known events. The method is better at detecting sudden introductions (Nevaeh) than accelerations of existing trends (Jennifer). This is a genuine limitation, not just a matter of tuning.

---

## Open Data and Reproducibility

The SSA baby name dataset is in the public domain. It is published annually by the Social Security Administration and can be downloaded freely from [ssa.gov](https://www.ssa.gov/oact/babynames/).

Our analysis pipeline is open-source under the MIT license. It consists of 10 stages — acquire, wave-shape analysis, era clustering, diversity metrics, gender-crossing detection, cultural trigger analysis, co-wave grouping, search index, validation, and export — implemented in Python. The pipeline is designed to be rerunnable: given the raw SSA data, it produces all derivative datasets and metrics reported in this paper.

The interactive dashboard is available at [names.onehundredyears.report](https://names.onehundredyears.report).

We have made every effort to ensure that the numbers in this paper can be independently verified. If you find errors, we want to know.

---

## Acknowledgments

The Social Security Administration publishes this dataset as a public service. We are grateful for it. Clean, freely available, well-documented government data is a public good that makes work like this possible.

This paper is Issue 02 in the *One Hundred Years* reporting series. The project applies long-duration quantitative analysis to publicly available datasets, with an emphasis on transparent methods, reproducible pipelines, and honest discussion of limitations.

The pipeline and dashboard were built by a small team. The analysis was computed, not intuited. The interpretations are ours, and they may be wrong. We present them as hypotheses, not conclusions.

---

*Report 02 of 10 in the One Hundred Years series.*
[names.onehundredyears.report](https://names.onehundredyears.report)

**Contact:** hello@onehundredyears.report
**License:** MIT
**Repository:** github.com/doctorbrownphd/hundred-years-names
