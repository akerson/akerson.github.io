"use explicit";

const designs = [];
let results = {};
const features = [];
const catalog = [];
let allowedRatings = ["Q10","Q9","Q8","Q7","Q6","Q5","Q4","Q3"];

const $results = $("#results");

const Segments = ["Costcutter","Innovator","Mercedes","Workhorse","Traveler"];

function loadDesigns() {
    $.ajax({
        url: "brands.json",
    }).done((data) => {
        $.each(data, function(i,props){
            const design = new Design(props);
            designs.push(design);
        });
    });
}

function toggleRating(rating) {
    if (allowedRatings.includes(rating)) allowedRatings = allowedRatings.filter(q=>q !== rating);
    else allowedRatings.push(rating);
    console.log(allowedRatings);
}

function nameToDesign(designName) {
    return designs.find(d=>d["Brand"] === designName);
}

class Design {
    constructor(props) {
        Object.assign(this, props);
    }
}

function compareDesigns(design1,design2) {
    let differences = 0;
    Object.keys(design1).forEach(key => {
        if (key === "Company" || key === "Brand" || Segments.includes(key)) return;
        if (design1[key] !== design2[key]) {
            differences += 1;
        }
    });
    return differences.toString();
}

function closestToDesign(brandName) {
    const myDesign = designs.find(d=>d["Brand"] === brandName);
    let closestDesign = null;
    let minDifference = 100;
    designs.forEach(design => {
        if (design["Brand"] === brandName) return;
        const difference = compareDesigns(myDesign,design);
        console.log(difference);
        if (difference < minDifference) {
            minDifference = difference;
            closestDesign = design["Brand"];
        }
    });
    return [minDifference,closestDesign];
}

function listDifferences(brand1,brand2) {
    const design1 = designs.find(d=>d["Brand"] === brand1);
    const design2 = designs.find(d=>d["Brand"] === brand2);
    const differenceNames = [];
    Object.keys(design1).forEach(key => {
        if (key === "Company" || key === "Brand" || key === "Quarter" || Segments.includes(key)) return;
        if (design1[key] !== design2[key]) {
            differenceNames.push(key);
        }
    });
    return differenceNames;
}

function listDifferences2(design1,design2) {
    const differenceNames = [];
    Object.keys(design1).forEach(key => {
        if (key === "Company" || key === "Brand" || key === "Quarter" || Segments.includes(key)) return;
        if (design1[key] !== design2[key]) {
            differenceNames.push(key);
        }
    });
    return differenceNames;
}

function b2d(name) {
    return designs.find(d=>d["Brand"] === name);
}

function compareAllDesigns() {
    results = {};
    for (let i=0;i<designs.length-1;i++) {
        if (!allowedRatings.includes(designs[i]["Quarter"])) continue;
        for (let j=i+1;j<designs.length;j++) {
            if (!allowedRatings.includes(designs[j]["Quarter"])) continue;
            const result = compareDesigns(designs[i],designs[j]);
            if (results[result] === undefined) results[result] = [];
            results[result].push([designs[i]["Brand"],designs[j]["Brand"]]);
        }
    }
    $results.empty();
    Object.keys(results).forEach(result => {
        const d = $("<div/>").appendTo($results);
        $("<div/>").html(`<h3>${result}:</h3>`).appendTo(d);
        results[result].forEach(r=>{
            $("<div/>").html(`<b>${r[0]} (${nameToDesign(r[0])["Quarter"]}), ${r[1]} (${nameToDesign(r[1])["Quarter"]})</b>`).appendTo(d);
            const e = $("<div/>").appendTo(d);
            listDifferences(r[0],r[1]).forEach(difference => {
                $("<span/>").html(`${difference}: ${b2d(r[0])[difference]}, ${b2d(r[1])[difference]}&nbsp;&nbsp;|&nbsp;&nbsp;`).appendTo(e);
            })
            const f = $("<div/>").appendTo(d);
            Segments.forEach(segment => {
                $("<span/>").html(`${segment}: ${b2d(r[0])[segment]}-${b2d(r[1])[segment]}&nbsp;&nbsp;|&nbsp;&nbsp;`).appendTo(f);
            })
        })
    })
}

function displayThisBullshit() {
    $results.empty();
    let content = `<div class="divTable"><div class="divTableBody" id="sortableTable">`;
    content += `<div class="divTableRow divTableHeading"><div class="divTableCell">Feature</div><div class="divTableCell">From</div><div class="divTableCell">To</div><div class="divTableCell">Costcutter</div><div class="divTableCell">Innovator</div><div class="divTableCell">Mercedes</div><div class="divTableCell">Workhorse</div><div class="divTableCell">Traveler</div></div>`;
    features.map(f=>f.autoFlip());
    const sortedFeatures = features.sort((a,b) => {
        const textA = a["feature"];
        const textB = b["feature"];
        const text1A = a["feature1"];
        const text1B = b["feature1"];
        return (textA < textB) ? -1 : (textA > textB) ? 1 : (text1A < text1B) ? -1 : (text1A > text1B) ? 1 : 0;
    })
    sortedFeatures.forEach(feature => content += feature.getRow());
    content += "</div></div>";
    $results.html(content);
    $('#sortableTable').sortable({
        group: 'list',
        animation: 200,
        ghostClass: 'ghost',
    });
}

function findValue() {
    //this attempts to identify the values associated with each feature
    //find differences between brands, log those differences and associated score changes
    let currentLength = 0;
    let maxDifferences = 1;
    while (true) {
        for (let i=0;i<designs.length-1;i++) {
            if (!allowedRatings.includes(designs[i]["Quarter"])) continue;
            for (let j=0;j<designs.length;j++) {
                if (!allowedRatings.includes(designs[j]["Quarter"])) continue;
                //we need to cycle through each design. Identify every difference in feature.
                //cycle through each feature, remove features already catalogued
                //if only one feature remains, create new feature class and add to list
                const differences = listDifferences2(designs[i],designs[j]);
                if (differences.length > maxDifferences) continue;
                const remainingdifferences = differences.filter(f=>
                    !catalog.includes(f+designs[i][f]+designs[j][f])
                );
                if (remainingdifferences.length !== 1) continue;
                //if we made it here, we have one difference remaining. Calculate the existing
                //features score differential to modify the overall for the new feature.
                const existingdifference = differences.filter(f=>
                    catalog.includes(f+designs[i][f]+designs[j][f])
                );
                console.log(differences,maxDifferences);
                console.log(existingdifference);
                let scoremodification = [0,0,0,0,0]
                existingdifference.forEach(d => {
                    const existingfeature = features.find(f=>f.match(d,designs[i][d],designs[j][d]));
                    const newscore = existingfeature.getScoreModification(d,designs[i][d],designs[j][d]);
                    scoremodification = sumArray(scoremodification,newscore);
                });
                const newFeatureName = remainingdifferences[0];
                const newfeature = new Feature(designs[i],designs[j],newFeatureName,scoremodification);
                features.push(newfeature);
                catalog.push(newFeatureName+designs[i][newFeatureName]+designs[j][newFeatureName]);
                catalog.push(newFeatureName+designs[j][newFeatureName]+designs[i][newFeatureName]);
            }
        }
        if (currentLength === features.length && maxDifferences > 30) break;
        currentLength = features.length;
        maxDifferences += 1;
    }
    displayThisBullshit();
}

class Feature {
    constructor(design1,design2,feature,score) {
        this.id1 = feature+design1[feature]+design2[feature];
        this.id2 = feature+design2[feature]+design1[feature];
        this.design1 = design1;
        this.design2 = design2;
        this["Costcutter"] = design2["Costcutter"] - design1["Costcutter"] + score[0];
        this["Innovator"]  = design2["Innovator"]  - design1["Innovator"] + score[1];
        this["Mercedes"]   = design2["Mercedes"]   - design1["Mercedes"] + score[2];
        this["Workhorse"]  = design2["Workhorse"]  - design1["Workhorse"] + score[3];
        this["Traveler"]   = design2["Traveler"]   - design1["Traveler"] + score[4];
        if (feature === "Autobackup") console.log(design1["Brand"],design2["Brand"],score)
        if (feature === "Case") {
            console.log(design1["Brand"],design2["Brand"]);
            console.log(score);
            console.log(this["Costcutter"],this["Innovator"],this["Mercedes"],this["Workhorse"],this["Traveler"])
        }
        this.feature = feature;
        this.feature1 = design1[feature];
        this.feature2 = design2[feature];
    }
    match(feature,feature1,feature2) {
        if (feature !== this.feature) return false;
        if (feature1 === this.feature1 && feature2 === this.feature2) return true;
        if (feature2 === this.feature1 && feature1 === this.feature2) return true;
        return false;
    }
    getScoreModification(feature,feature1,feature2) {
        if (feature !== this.feature) return [0,0,0,0,0];
        if (feature1 === this.feature1 && feature2 === this.feature2) {
            return [-this["Costcutter"],-this["Innovator"],-this["Mercedes"],-this["Workhorse"],-this["Traveler"]];
        }
        else if (feature1 === this.feature2 && feature2 === this.feature1) {
            return [this["Costcutter"],this["Innovator"],this["Mercedes"],this["Workhorse"],this["Traveler"]];
        }
        else return [0,0,0,0,0];
    }
    getRow() {
        return `<div class="divTableRow"><div class="divTableCell featureName">${this.feature}</div><div class="divTableCell toFeature">${this.feature1}</div><div class="divTableCell fromFeature">${this.feature2}</div><div class="divTableCell cc">${this["Costcutter"]}</div><div class="divTableCell ino">${this["Innovator"]}</div><div class="divTableCell mer">${this["Mercedes"]}</div><div class="divTableCell wh">${this["Workhorse"]}</div><div class="divTableCell tra">${this["Traveler"]}</div></div>`;
    }
    reverse() {
        const tempid = this.id1;
        const tempdesign = this.design1;
        const tempfeature = this.feature1;
        this.id1 = this.id2;
        this.design1 = this.design2;
        this.feature1 = this.feature2;
        this.id2 = tempid;
        this.design2 = tempdesign;
        this.feature2 = tempfeature;
        this["Costcutter"] = -this["Costcutter"];
        this["Innovator"] = -this["Innovator"];
        this["Mercedes"] = -this["Mercedes"];
        this["Workhorse"] = -this["Workhorse"];
        this["Traveler"] = -this["Traveler"];
    }
    autoFlip() {
        if (this.feature1 === "X") this.reverse();
        if (this.feature1 === "Slim" && this.feature2 === "Standard") this.reverse();
        if (this.feature1 === "High speed" && this.feature2 === "Budget") this.reverse();
        if (this.feature1 === "Ultra fast" && this.feature2 === "Mid-range") this.reverse();
        if (this.feature1 === "Ultra capacity" && this.feature2 === "High capacity") this.reverse();
        if (this.feature2 === '14" standard (laptop)') this.reverse();
        if (this.feature1 === '19" standard (desktop)' && this.feature2 === '17" advanced (laptop)') this.reverse();
        if (this.feature1 === '21" high res. (desktop)') this.reverse();
        if (this.feature1 === "Standard" && this.feature2 === "None") this.reverse();
        if (this.feature1 === "Professional" && this.feature2 === "Lite") this.reverse();
        if (this.feature1 === "For professionals" && this.feature2 === "Basic edition") this.reverse();
    }
}

function sumArray(a1,a2) {
    return a1.map((num,idx) => {
        return num + a2[idx];
    });
}

$(document).on("dblclick",".divTableRow",e => {
    e.preventDefault();
    //flip the from and to and reverse scores on the associated div
    const todiv = $(e.currentTarget).find(".toFeature");
    const fromdiv = $(e.currentTarget).find(".fromFeature");
    const toText = todiv.text();
    todiv.html(fromdiv.text());
    fromdiv.html(toText);
    const cc = $(e.currentTarget).find(".cc");
    const cc1 = (parseInt(cc.text())*-1).toString();
    cc.text(cc1);
    const ino = $(e.currentTarget).find(".ino");
    const ino1 = (parseInt(ino.text())*-1).toString();
    ino.text(ino1);
    const mer = $(e.currentTarget).find(".mer");
    const mer1 = (parseInt(mer.text())*-1).toString();
    mer.text(mer1);
    const wh = $(e.currentTarget).find(".wh");
    const wh1 = (parseInt(wh.text())*-1).toString();
    wh.text(wh1);
    const tra = $(e.currentTarget).find(".tra");
    const tra1 = (parseInt(tra.text())*-1).toString();
    tra.text(tra1);
});

loadDesigns();

