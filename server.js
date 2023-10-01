import express from 'express';

// express app
const app = express()

const port = 8000

// middleware
app.use(express.json())

let totalPoints=0
let tail=null
let head=null
let payerCount={}

class Node {
  constructor(payer, points, timestamp) {
    this.payer=payer
    this.points = points
    this.timestamp = timestamp
    this.next = null 
    this.prev = null               
  }
}

app.post('/add', (req, res) => {
  const payer = req.body.payer
  const points = req.body.points
  const timestamp = req.body.timestamp

  if (payer in payerCount) {
    payerCount[payer]++
  } else {
    payerCount[payer]=1
  }

  let node = new Node(payer, points, timestamp)

  if (!head && !tail) {
    head=node
    tail=node
  } else if (Date.parse(timestamp)>Date.parse(tail.timestamp)) {
    tail.next=node
    node.prev=tail
    tail=node
  } else if (Date.parse(timestamp)<=Date.parse(head.timestamp)) {
    node.next=head
    head.prev=node
    head=node
  } else {
    current=head
    while (Date.parse(current.timestamp)<=Date.parse(node.timestamp)) {
      current=current.next
    }

    prevNode=current.prev
    prevNode.next=node
    node.prev=prevNode

    node.next=current
    current.prev=node
  }

  totalPoints=totalPoints+points
  console.log(totalPoints)

  res.status(200).end()
})

app.post('/spend', (req, res) => {
  let points = req.body.points

  if (points>totalPoints) {
    res.status(400).end()
    return
  }

  let output = {}
  let current=head

  while (current) {
    if (points>0) {
      if (current.points>=points) {
        let remPoints=current.points-points
        current.points=remPoints

        if (current.payer in output) {
          output[current.payer]-=points
        } else {
          output[current.payer]= -points
        }

        totalPoints=totalPoints-points

        points=0
      } else {
        points=points-current.points
        totalPoints=totalPoints-current.points

        if (current.payer in output) {
          output[current.payer]-=current.points
        } else {
          output[current.payer]= -current.points
        }

        if (payerCount[current.payer]>1 && current.prev) {
          payerCount[current.payer]--
          let prevNode=current.prev
          let nextNode=current.next

          current=current.next

          prevNode.next=nextNode
          nextNode.prev=prevNode
        } else if (payerCount[current.payer]>1 && !current.prev) {
          payerCount[current.payer]--
          let nextNode=current.next

          current=current.next

          nextNode.prev=null
          head=nextNode
        } else if (payerCount[current.payer]==1) {
          current.points=0
          current=current.next
        }
      }
    } else {
      if (current.points<0) {
        points+=-current.points
        current.points=0
      }
      current=current.next
    }
  }

  let outputList=[]

  for (const p in output) {
    outputList.push({
      payer: p,
      points: output[p]
    })
  }

  res.status(200).json(outputList)
})

app.get('/balance', (req, res) => {
  let output = {}
  let current=head
  while (current) {
    if (current.payer in output) {
      output[current.payer]+=current.points
    } else {
      output[current.payer]=current.points
    }

    current=current.next
  }

  res.status(200).json(output)
})


app.listen(port, () => {
    console.log('listening on port', port)
})
