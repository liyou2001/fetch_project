import express from 'express';

// express app
const app = express()

const port = 8000

// middleware
app.use(express.json())

let totalPoints=0 // total number of points, useful for sanity checks
let tail=null // node with the latest timestamp
let head=null // node with the earliest timestamp
let payerPoints={} // number of points for each payer

// Node class for the linked list
class Node {
  constructor(payer, points, timestamp) {
    this.payer=payer
    this.points = points
    this.timestamp = timestamp
    this.next = null // Next node that this node points to            
  }
}

app.post('/add', (req, res) => {
  const payer = req.body.payer
  const points = req.body.points
  const timestamp = req.body.timestamp

  // update payerPoints
  if (payer in payerPoints) {
    payerPoints[payer]+=points
  } else {
    payerPoints[payer]=points
  }

  let node = new Node(payer, points, timestamp)

  if (!head && !tail) {
    // linked list is currently empty
    head=node
    tail=node
  } else if (Date.parse(timestamp)>Date.parse(tail.timestamp)) {
    // this transaction is the latest, append it
    tail.next=node
    tail=node
  } else if (Date.parse(timestamp)<=Date.parse(head.timestamp)) {
    // this transaction is the earliest, insert in front
    node.next=head
    head=node
  } else {
    // find position for this transaction to be inserted
    current=head
    while (current.next) {
      if (Date.parse(current.next.timestamp)>=Date.parse(node.timestamp)){
        break
      }
      current=current.next
    }

    // link
    let nextNode=current.next
    current.next=node
    node.next=nextNode
  }

  // update total 
  totalPoints=totalPoints+points
  
  res.status(200).end()
})

app.post('/spend', (req, res) => {
  let points = req.body.points // points to be spent

  if (points>totalPoints) {
    res.status(400).send("User doesn't have enough points!")
    return
  }

  let output = {} // record where the points are being spent on

  let current=head

  // traverse linked list
  while (current && points>0) {
    if (current.points>=points) {
      let remPoints=current.points-points // remaining points of current node after spending
      current.points=remPoints

      // add to output
      if (current.payer in output) {
        output[current.payer]-=points
      } else {
        output[current.payer]= -points
      }

      // update total
      totalPoints=totalPoints-points
      payerPoints[current.payer]-=points

      points=0 // no more points to be spent
    } else {
      // after spending this transaction's points, there are still more 
      // points to be spent
      points=points-current.points
      totalPoints=totalPoints-current.points
      payerPoints[current.payer]-=current.points

      // add to output
      if (current.payer in output) {
        output[current.payer]-=current.points
      } else {
        output[current.payer]= -current.points
      }

      // remove this node while moving to the next
      current=current.next
    } 
  }

  // reformat output data into a list
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
  res.status(200).json(payerPoints)
})


app.listen(port, () => {
    console.log('listening on port', port)
})
