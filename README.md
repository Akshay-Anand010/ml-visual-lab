# ML Visual Lab

Interactive visual explanations of core machine learning ideas: neural networks, backpropagation, CNNs, RNNs, TF-IDF, Word2Vec, and attention.

**Live site:** https://akshay-anand010.github.io/ml-visual-lab/

## Local

Because the site uses ES modules, open it through a tiny static server (not `file://`):

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Labs

| Lab | What you see |
| --- | --- |
| Neural network | Activations pulse along weights as you change inputs |
| Backpropagation | XOR trainer; error flows backward; loss curve |
| CNN | A 3×3 kernel scans a tiny image; ReLU + max-pool |
| RNN | One cell unrolled over “The cat sat on mat” |
| TF-IDF | Edit three documents; heatmap of distinctive terms |
| Word2Vec | Skip-gram pulls neighbors together in 2D |
| Attention | Query–key heatmap; mix of values |

The math is simplified so the picture stays honest, not a black box.
