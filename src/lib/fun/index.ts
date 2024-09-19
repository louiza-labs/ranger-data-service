// ... existing code ...
import * as readline from "readline";

// Expanded joke sets for different comedians
const comedianBits: any = {
	"Eddie Murphy": [
		"You ever notice how people who drive slower than you are idiots, and people who drive faster than you are maniacs?",
		"I told my kids, 'You can be anything you want to be.' They said, 'We want to be you, Dad.' I said, 'No, you can't. I'm already taken!'",
		"You know you're getting old when the candles cost more than the cake.",
		"And what's the deal with people who say, 'It is what it is'? No, it isn't! It could be better!",
		"I mean, come on! You ever try to explain to your kids why they can't have a pet tiger? It's a tough conversation!",
	],
	"Chris Rock": [
		"I love being famous. It's like being a superhero, but without the powers.",
		"You know the world is messed up when you have to explain to your kids why they can't have a pet tiger.",
		"I used to think I was indecisive, but now I'm not so sure.",
		"And why is it that every time I go to the grocery store, I see someone with a full cart and they look at me like I'm the problem?",
		"You ever notice how people get mad at you for being honest? It's like, 'Hey, I'm just telling you what I think!'",
	],
	"Bill Burr": [
		"I don't understand why people get mad at me for being honest. It's like, 'Hey, I'm just telling you what I think!'",
		"You ever notice how the people who are the most offended are usually the ones who have the most to hide?",
		"I love how people say, 'Money can't buy happiness.' Well, it can buy a jet ski, and have you ever seen anyone frown on a jet ski?",
		"And what's the deal with people who complain about the weather? It's like, 'You live in New England, what did you expect?'",
		"You know what I hate? When people say, 'It is what it is.' No, it isn't! It could be better!",
	],
	"Richard Pryor": [
		"I had a friend who was a hypochondriac. He thought he was sick all the time. I told him, 'You’re not sick, you’re just paranoid!'",
		"You know you're in trouble when your doctor says, 'I have good news and bad news.'",
		"I don't know how to explain it, but I just feel like I’m always in the wrong place at the wrong time.",
		"And you ever notice how people act when they think nobody's watching? It's like, 'Come on, we all know you're not that cool!'",
		"You know what I love? When people say, 'I don't care what people think.' Yeah, right! Everyone cares!",
	],
	"Larry David": [
		"You ever notice how people are always in a rush? I mean, where are they going? It's not like they're going to a better place.",
		"I don't understand why people get so upset over little things. It's like, 'Relax! It's just a parking spot.'",
		"You know what I hate? When people say, 'It is what it is.' No, it isn't! It could be better!",
		"And what's the deal with people who don't return their shopping carts? It's like, 'Come on, it's not that hard!'",
		"You ever try to have a conversation with someone who just won't stop talking? It's like, 'Can I get a word in here?'",
	],
};

// Function to get a random stand-up bit based on comedian style
function getRandomStandupBit(style: string) {
	const bits = comedianBits[style];
	const randomIndex = Math.floor(Math.random() * bits.length);
	return bits[randomIndex];
}

// Function to run the interactive stand-up command with comedian style
function runInteractiveStandupCommand() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question(
		"Choose a comedian style (Eddie Murphy, Chris Rock, Bill Burr, Richard Pryor, Larry David): ",
		(style) => {
			if (comedianBits[style]) {
				const tellStandupBit = () => {
					console.log(getRandomStandupBit(style));
					setTimeout(() => {
						rl.question("Do you want to hear another stand-up bit? (yes/no) ", (answer) => {
							if (answer.toLowerCase() === "yes") {
								tellStandupBit();
							} else {
								console.log("Thanks for laughing! Have a great day! 😄");
								rl.close();
							}
						});
					}, 500); // Wait for 500 ms before prompting
				};

				tellStandupBit();
			} else {
				console.log("Sorry, that comedian style is not recognized.");
				rl.close();
			}
		}
	);
}

runInteractiveStandupCommand();
